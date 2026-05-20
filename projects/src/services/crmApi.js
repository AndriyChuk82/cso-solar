import { supabase } from '../services/supabaseClient';

export const crmApi = {
  // === КЛІЄНТИ ===
  getClients: async () => {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        projects (*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  saveClient: async (client) => {
    const { data, error } = await supabase
      .from('clients')
      .upsert({ ...client, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getProjectsByClient: async (clientId) => {
    // 1. Fetch projects
    const { data: projects, error: pError } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (pError) throw pError;
    if (!projects || projects.length === 0) return [];

    const projectIds = projects.map(p => p.id);

    // 2. Fetch related data in parallel
    const [paymentsRes, itemsRes, shipmentsRes, shipmentItemsRes] = await Promise.all([
      supabase.from('project_payments').select('*').in('project_id', projectIds),
      supabase.from('project_items').select('*').in('project_id', projectIds),
      supabase.from('project_shipments').select('*').in('project_id', projectIds),
      supabase.from('shipment_items').select('*') // We'll filter this below
    ]);

    // 3. Assemble the data
    return projects.map(p => {
      const pShipments = (shipmentsRes.data || []).filter(s => s.project_id === p.id);
      
      // Attach shipment_items to each shipment
      const shipmentsWithItems = pShipments.map(s => ({
        ...s,
        shipment_items: (shipmentItemsRes.data || []).filter(si => si.shipment_id === s.id)
      }));

      return {
        ...p,
        project_payments: (paymentsRes.data || []).filter(pay => pay.project_id === p.id),
        project_items: (itemsRes.data || []).filter(item => item.project_id === p.id),
        project_shipments: shipmentsWithItems
      };
    });
  },

  // === ФІНАНСИ (ПЛАТЕЖІ) ===
  getPaymentsByProject: async (projectId) => {
    const { data, error } = await supabase
      .from('project_payments')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  },

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
    return data;
  },

  // === ЛОГІСТИКА (МАТЕРІАЛИ ТА ВІДВАНТАЖЕННЯ) ===
  getProjectItems: async (projectId) => {
    const { data, error } = await supabase
      .from('project_items')
      .select('*')
      .eq('project_id', projectId);
    if (error) throw error;
    return data;
  },

  getShipments: async (projectId) => {
    const { data, error } = await supabase
      .from('project_shipments')
      .select(`
        *,
        shipment_items (*)
      `)
      .eq('project_id', projectId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  },

  saveShipment: async (shipment, items) => {
    // 1. Save shipment header
    const shipPayload = {
      project_id: shipment.project_id,
      date: shipment.date || new Date().toISOString().split('T')[0],
      carrier: shipment.carrier,
      tracking_number: shipment.tracking_number,
      note: shipment.note
    };
    if (shipment.id) shipPayload.id = shipment.id;

    const { data: shipData, error: shipError } = await supabase
      .from('project_shipments')
      .upsert(shipPayload)
      .select()
      .single();
    
    if (shipError) {
      console.error("Error saving shipment:", shipError);
      throw shipError;
    }

    // 2. Save items if provided
    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => {
        const payload = {
          shipment_id: shipData.id,
          project_item_id: item.project_item_id,
          quantity: item.quantity
        };
        if (item.id) payload.id = item.id;
        return payload;
      });
      
      const { error: itemsError } = await supabase
        .from('shipment_items')
        .upsert(itemsToInsert);
        
      if (itemsError) {
        console.error("Error saving shipment items:", itemsError);
        throw itemsError;
      }
    }
    
    return shipData;
  }
};
