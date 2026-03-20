const GAS_URL = 'https://script.google.com/macros/s/AKfycbxqQEMJ4vKBExxmh5-ft-UGVpU9rms4vPd9z0XgZv3b33sJDvXyZoIntOj61TVg9fLK/exec';

async function gasRequest(action, params = {}, method = 'GET') {
  const url = new URL(GAS_URL);

  if (method === 'GET') {
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'text/plain' }
    });
    if (!response.ok) throw new Error(`Помилка сервера: ${response.status}`);
    return response.json();
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...params })
  });
  if (!response.ok) throw new Error(`Помилка сервера: ${response.status}`);
  return response.json();
}

export const projectService = {
  // Projects
  getProjects: (userEmail) => gasRequest('getProjects', { userEmail }),
  getProjectDetails: (projectId) => gasRequest('getProjectDetails', { projectId }),

  // Save project (supports agreed_sum field)
  saveProject: (project) => gasRequest('saveProject', { project }, 'POST'),

  // Payments (payment_type: 'Аванс' | 'Повна оплата')
  savePayment: (payment) => gasRequest('savePayment', { payment }, 'POST'),
  cancelPayment: (paymentId) => gasRequest('cancelPayment', { paymentId }, 'POST'),

  // Items
  saveProjectItem: (item) => gasRequest('saveProjectItem', { item }, 'POST'),
  deleteProjectItem: (itemId) => gasRequest('deleteProjectItem', { itemId }, 'POST'),

  // Proposals (for linking to projects)
  getProposals: () => gasRequest('getProposals', {}, 'POST'),
  syncProjectItems: (projectId) => gasRequest('syncProjectItems', { projectId }, 'POST'),
};
