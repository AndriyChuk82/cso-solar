// ===== CSO Solar — Green Tariff v2 API Service =====

import type { GASResponse, SemanticProject, FileAttachment } from '../types';
import { toRawGASProject } from '../utils/mapper';

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
  return gasGTRequest('getProjects');
}

export async function saveProject(
  project: SemanticProject,
  files: FileAttachment[],
  id: string | null
): Promise<GASResponse> {
  const rawProject = toRawGASProject(project);
  return gasGTRequest('saveProject', {
    action: 'saveProject',
    project: rawProject,
    files,
    id,
  });
}

export async function fetchEquipment(): Promise<GASResponse> {
  return gasGTRequest('getEquipment');
}

export async function deleteProject(id: string): Promise<GASResponse> {
  return gasGTRequest('deleteProject', { id });
}

export const gtApi = {
  fetchProjects,
  saveProject,
  gasGTRequest,
  fetchEquipment,
  deleteProject,
};
