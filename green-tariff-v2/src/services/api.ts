// ===== CSO Solar — Green Tariff v2 API Service (Supabase + Google Drive Hybrid) =====

import type { GASResponse, SemanticProject, FileAttachment } from '../types';
import { toRawGASProject } from '../utils/mapper';
import { supabase } from './supabaseClient';

const GT_CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbxc21z2v5vbzF4n4lLRoS-SEkKI6b4QD2ddR9XeWN3QOCpm4HwCUh3MGxxy_05Z8ZCwhw/exec',
};

export async function gasGTRequest(action: string, params: Record<string, unknown> = {}): Promise<GASResponse> {
  if (!GT_CONFIG.GAS_URL) {
    return { success: false, error: 'GAS URL not configured' };
  }

  try {
    const response = await fetch(GT_CONFIG.GAS_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, ...params }),
    });

    return await response.json();
  } catch (e) {
    console.error('GT GAS Request Error:', e);
    return { success: false, error: (e as Error).message };
  }
}

export async function fetchProjects(): Promise<GASResponse> {
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }
  try {
    const { data, error } = await supabase
      .from('green_tariff_projects')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return { success: true, projects: data || [] };
  } catch (e) {
    console.error('Fetch Projects Error:', e);
    return { success: false, error: (e as Error).message };
  }
}

export async function saveProject(
  project: SemanticProject,
  files: FileAttachment[],
  id: string | null
): Promise<GASResponse> {
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  try {
    let folderUrl = project.folderUrl || '';

    // 1. If files are uploaded, upload them to Google Drive via Apps Script first
    if (files.length > 0) {
      // Pass the current folder URL if it already exists, so Apps Script doesn't create a new one
      const uploadRes = await gasGTRequest('saveProject', {
        project: { ...toRawGASProject(project), folderurl: folderUrl },
        files,
        id,
      });
      if (uploadRes.success && uploadRes.folderUrl) {
        folderUrl = uploadRes.folderUrl;
      } else if (!uploadRes.success) {
        return uploadRes; // Forward error from GAS
      }
    }

    // 2. Save project to Supabase
    const isNew = !id || id.startsWith('temp_');
    const dbProject: any = { ...project };

    // Embed colorTag tag into internalComment
    if (project.colorTag && project.colorTag !== 'none') {
      let comment = project.internalComment || '';
      if (!comment.match(/^\[tag:[a-z]+\]/i)) {
        comment = `[tag:${project.colorTag}] ${comment}`.trim();
      }
      dbProject.internalComment = comment;
    } else if (dbProject.internalComment) {
      dbProject.internalComment = dbProject.internalComment.replace(/^\[tag:[a-z]+\]\s*/i, '');
    }

    // Map serviceContractDate to reserve column
    dbProject.reserve = project.serviceContractDate || project.reserve || '';

    // Remove transient non-schema properties that cause PGRST204 errors in Supabase
    delete dbProject.colorTag;
    delete dbProject.serviceContractDate;

    // Clean up empty fields that shouldn't override default DB values
    if (!dbProject.createdAt) {
      delete dbProject.createdAt;
    }
    dbProject.folderUrl = folderUrl;

    if (isNew) {
      delete dbProject.id;
      const { data, error } = await supabase
        .from('green_tariff_projects')
        .insert([dbProject])
        .select()
        .single();

      if (error) throw error;
      return { success: true, id: data.id, folderUrl: data.folderUrl };
    } else {
      dbProject.id = id;
      const { data, error } = await supabase
        .from('green_tariff_projects')
        .update(dbProject)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, id: data.id, folderUrl: data.folderUrl };
    }
  } catch (e) {
    console.error('Save Project Error:', e);
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteProject(id: string): Promise<GASResponse> {
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }
  try {
    // 1. Delete from Supabase
    const { error } = await supabase
      .from('green_tariff_projects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // 2. Asynchronously delete from Google Sheets as a backup sync
    gasGTRequest('deleteProject', { id }).catch(err => {
      console.warn('Backup sheet delete failed (non-critical):', err);
    });

    return { success: true };
  } catch (e) {
    console.error('Delete Project Error:', e);
    return { success: false, error: (e as Error).message };
  }
}

export async function fetchEquipment(): Promise<GASResponse> {
  return gasGTRequest('getEquipment');
}

export interface SpecFileItem {
  name: string;
  size?: number;
  publicUrl: string;
  updatedAt?: string;
}

export async function fetchSpecsFileList(): Promise<string[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .storage
      .from('equipment-specs')
      .list('', { limit: 1000 });

    if (error) throw error;
    return (data || []).map(f => f.name);
  } catch (e) {
    console.error('Error listing specs files:', e);
    return [];
  }
}

export async function fetchSpecsFileListDetails(): Promise<SpecFileItem[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .storage
      .from('equipment-specs')
      .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

    if (error) throw error;
    
    const client = supabase;
    return (data || [])
      .filter(f => f.name && f.name !== '.emptyFolderPlaceholder')
      .map(f => {
        const { data: pubData } = client.storage.from('equipment-specs').getPublicUrl(f.name);
        return {
          name: f.name,
          size: f.metadata?.size,
          publicUrl: pubData.publicUrl,
          updatedAt: f.updated_at || f.created_at || undefined,
        };
      });
  } catch (e) {
    console.error('Error listing specs files with details:', e);
    return [];
  }
}

export async function uploadSpecFile(file: File): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };
  try {
    const { error } = await supabase
      .storage
      .from('equipment-specs')
      .upload(file.name, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    console.error('Error uploading spec file to Supabase:', e);
    return { success: false, error: e.message || 'Помилка завантаження файлу' };
  }
}

export async function deleteSpecFile(fileName: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };
  try {
    const { error } = await supabase
      .storage
      .from('equipment-specs')
      .remove([fileName]);

    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    console.error('Error deleting spec file from Supabase:', e);
    return { success: false, error: e.message || 'Помилка видалення файлу' };
  }
}

export const gtApi = {
  fetchProjects,
  saveProject,
  gasGTRequest,
  fetchEquipment,
  deleteProject,
  fetchSpecsFileList,
  fetchSpecsFileListDetails,
  uploadSpecFile,
  deleteSpecFile,
};

