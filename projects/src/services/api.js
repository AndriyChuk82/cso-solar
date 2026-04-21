const GAS_URL = import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/AKfycbyvYNoyGINAtWlbExzONJWoReE8OC3_-FhOase5pHkCZ_PdCLXuMQqXqMYBWLzaNX-s/exec';

async function gasRequest(action, params = {}, method = 'GET') {
  const startTime = performance.now();
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
    const data = await response.json();
    const endTime = performance.now();
    console.log(`[Projects API] ${action} completed in ${(endTime - startTime).toFixed(2)}ms`);
    return data;
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...params })
  });
  if (!response.ok) throw new Error(`Помилка сервера: ${response.status}`);
  const data = await response.json();
  const endTime = performance.now();
  console.log(`[Projects API] ${action} completed in ${(endTime - startTime).toFixed(2)}ms`);
  return data;
}

export const projectService = {
  // Projects
  getProjects: (userEmail) => gasRequest('getProjects', { userEmail }, 'POST'),
  getProjectDetails: (projectId) => gasRequest('getProjectDetails', { projectId }, 'POST'),

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
