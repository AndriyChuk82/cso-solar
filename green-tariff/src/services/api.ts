// ===== CSO Solar — Green Tariff API Service =====

import type { GASResponse, GreenTariffProject, FileAttachment } from '../types';

const GT_CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbxc21z2v5vbzF4n4lLRoS-SEkKI6b4QD2ddR9XeWN3QOCpm4HwCUh3MGxxy_05Z8ZCwhw/exec',
  PARENT_SPREADSHEET_ID: '1FbzOPKEroa6QyghgqMFGJMRCdYx_yS0RDXoHzuI_GmY',
  GT_SHEET_NAME: 'Зелений тариф',
  DRIVE_FOLDER_ID: '1Bhkaot09fCC4rx5udWjHxExqre7LcCrF',
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
  project: GreenTariffProject,
  files: FileAttachment[],
  id: string | null
): Promise<GASResponse> {
  return gasGTRequest('saveProject', {
    action: 'saveProject',
    project,
    files,
    id,
  });
}

export async function fetchEquipment(): Promise<GASResponse> {
  return gasGTRequest('getEquipment');
}

export const gtApi = {
  fetchProjects,
  saveProject,
  gasGTRequest,
  fetchEquipment,
};

