import { supabase } from './supabaseClient';

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
  getProjects: async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, projects: data };
  },

  getProjectDetails: async (projectId) => {
    // Отримуємо проект, товари та платежі паралельно
    const [pRes, iRes, payRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('project_items').select('*').eq('project_id', projectId),
      supabase.from('project_payments').select('*').eq('project_id', projectId).order('date', { ascending: false })
    ]);

    if (pRes.error) throw pRes.error;

    return {
      success: true,
      project: pRes.data,
      items: iRes.data || [],
      payments: payRes.data || []
    };
  },

  // Save project
  saveProject: async (project) => {
    const { data, error } = await supabase
      .from('projects')
      .upsert({
        ...project,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, project: data };
  },

  // Payments
  savePayment: async (payment) => {
    const { data, error } = await supabase
      .from('project_payments')
      .upsert({
        ...payment,
        id: payment.id || `pay_${Date.now()}`
      })
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, payment: data };
  },

  deletePayment: async (paymentId) => {
    const { error } = await supabase
      .from('project_payments')
      .delete()
      .eq('id', paymentId);
    
    if (error) throw error;
    return { success: true };
  },

  // Items
  saveProjectItem: async (item) => {
    const { data, error } = await supabase
      .from('project_items')
      .upsert({
        ...item,
        id: item.id || `item_${Date.now()}`
      })
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, item: data };
  },

  deleteProjectItem: async (itemId) => {
    const { error } = await supabase
      .from('project_items')
      .delete()
      .eq('id', itemId);
    
    if (error) throw error;
    return { success: true };
  },

  // Решта функцій (якщо потрібні для сумісності)
  getProposals: async () => {
    // КП поки залишаємо в Google Sheets
    return gasRequest('getProposals', {}, 'POST');
  },

  importFromProposal: async (projectId, proposalId) => {
    try {
      // 1. Fetch proposal details from Google Sheets
      const propRes = await gasRequest('getProposals', {}, 'POST');
      if (!propRes.success) throw new Error(propRes.error);
      
      const proposal = propRes.proposals.find(p => p.id === proposalId);
      if (!proposal) throw new Error('КП не знайдено');
      
      const items = proposal.items || [];
      if (items.length === 0) throw new Error('В обраному КП немає товарів');

      // 2. Delete old KP-imported items in Supabase from project_materials_ledger
      const delRes = await supabase
        .from('project_materials_ledger')
        .delete()
        .eq('project_id', projectId)
        .like('note', '%Імпортовано з КП%');
        
      if (delRes.error) throw delRes.error;

      // 3. Insert new items into Supabase project_materials_ledger
      if (items.length > 0) {
        const newItems = items.map((item, index) => ({
          project_id: projectId,
          name: item.name || item.productName || 'Товар',
          quantity: parseFloat(item.quantity || item.qty || 0),
          unit: item.unit || 'шт.',
          price: parseFloat(item.price || item.unitPrice || 0),
          currency: 'USD',
          status: 'Видано',
          issued_at: new Date().toISOString(),
          issued_by: 'Комірник',
          is_priced: parseFloat(item.price || item.unitPrice || 0) > 0,
          added_to_debt: false,
          note: 'Імпортовано з КП'
        }));
        
        const insRes = await supabase.from('project_materials_ledger').insert(newItems);
        if (insRes.error) throw insRes.error;
      }

      // 4. Link proposal_id to project in Supabase
      const updRes = await supabase.from('projects').update({ proposal_id: proposalId }).eq('id', projectId);
      if (updRes.error) throw updRes.error;

      return { success: true };
    } catch (err) {
      console.error('importFromProposal error:', err);
      return { success: false, error: err.message || 'Помилка імпорту' };
    }
  }
};
