import { supabase } from '../services/supabaseClient';

export const crmApi = {
  // === КЛІЄНТИ ===
  getClients: async () => {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        projects (
          *,
          project_payments (*)
        )
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
  },

  createProject: async (clientId) => {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        client_id: clientId,
        name: `Нова угода (${new Date().toLocaleDateString('uk-UA')})`,
        status: 'В роботі',
        currency: 'USD',
        agreed_sum_usd: 0,
        agreed_sum_uah: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateProjectAgreedSums: async (projectId, sums) => {
    const { data, error } = await supabase
      .from('projects')
      .update({
        agreed_sum_usd: sums.usd,
        agreed_sum_uah: sums.uah,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateProjectStatus: async (projectId, status) => {
    const { data, error } = await supabase
      .from('projects')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  cancelPayment: async (paymentId) => {
    const { data, error } = await supabase
      .from('project_payments')
      .update({ status: 'Скасовано' })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  createProjectItems: async (projectId, items) => {
    if (!items || items.length === 0) return [];

    const payload = items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      return {
        project_id: projectId,
        name: item.name || 'Товар',
        quantity: qty,
        price: price,
        sum: qty * price,
        is_service: false,
        note: item.note || ''
      };
    });

    const { data, error } = await supabase
      .from('project_items')
      .insert(payload)
      .select();

    if (error) throw error;
    return (data || []).map((row, index) => ({
      project_item_id: row.id,
      quantity: parseFloat(items[index]?.quantity) || 0,
      price: parseFloat(items[index]?.price) || 0,
      currency: items[index]?.currency || 'USD'
    }));
  },

  deleteShipment: async (shipmentId) => {
    const { error: deleteItemsError } = await supabase
      .from('shipment_items')
      .delete()
      .eq('shipment_id', shipmentId);

    if (deleteItemsError) throw deleteItemsError;

    const { data, error } = await supabase
      .from('project_shipments')
      .delete()
      .eq('id', shipmentId)
      .select();

    if (error) throw error;
    return data;
  },

  updateProjectItemNote: async (itemId, note) => {
    const { data, error } = await supabase
      .from('project_items')
      .update({ note })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateProjectItemQuantity: async (itemId, quantity) => {
    const qty = parseFloat(quantity) || 0;
    // 1. Fetch current price
    const { data: item, error: fetchError } = await supabase
      .from('project_items')
      .select('price')
      .eq('id', itemId)
      .single();

    if (fetchError) throw fetchError;
    const price = parseFloat(item?.price) || 0;

    // 2. Update quantity and sum
    const { data, error } = await supabase
      .from('project_items')
      .update({ 
        quantity: qty,
        sum: qty * price
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  addProjectItem: async (projectId, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    const { data, error } = await supabase
      .from('project_items')
      .insert({
        project_id: projectId,
        name: item.name || 'Товар',
        quantity: qty,
        price: price,
        sum: qty * price,
        is_service: false,
        note: item.note || ''
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateProjectItemPrice: async (itemId, price) => {
    const prc = parseFloat(price) || 0;
    // 1. Fetch current quantity
    const { data: item, error: fetchError } = await supabase
      .from('project_items')
      .select('quantity')
      .eq('id', itemId)
      .single();

    if (fetchError) throw fetchError;
    const qty = parseFloat(item?.quantity) || 0;

    // 2. Update price and sum
    const { data, error } = await supabase
      .from('project_items')
      .update({ 
        price: prc,
        sum: qty * prc
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteProjectItem: async (itemId) => {
    const { data, error } = await supabase
      .from('project_items')
      .delete()
      .eq('id', itemId)
      .select();

    if (error) throw error;
    return data;
  },

  updateProjectAddress: async (projectId, address) => {
    const { data, error } = await supabase
      .from('projects')
      .update({
        address: address,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateProjectNote: async (projectId, note) => {
    const { data, error } = await supabase
      .from('projects')
      .update({
        note: note,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteProject: async (projectId) => {
    // 1. Delete project payments
    const { error: payErr } = await supabase
      .from('project_payments')
      .delete()
      .eq('project_id', projectId);
    if (payErr) throw payErr;

    // 2. Delete shipment items
    const { data: shipments, error: shipGetErr } = await supabase
      .from('project_shipments')
      .select('id')
      .eq('project_id', projectId);
    
    if (shipGetErr) throw shipGetErr;
    
    if (shipments && shipments.length > 0) {
      const shipIds = shipments.map(s => s.id);
      const { error: shipItemsErr } = await supabase
        .from('shipment_items')
        .delete()
        .in('shipment_id', shipIds);
      if (shipItemsErr) throw shipItemsErr;

      const { error: shipErr } = await supabase
        .from('project_shipments')
        .delete()
        .in('id', shipIds);
      if (shipErr) throw shipErr;
    }

    // 3. Delete project items
    const { error: itemsErr } = await supabase
      .from('project_items')
      .delete()
      .eq('project_id', projectId);
    if (itemsErr) throw itemsErr;

    // 4. Delete the project
    const { data, error: projErr } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .select();
      
    if (projErr) throw projErr;
    return data;
  },

  // === АУДИТ / ІСТОРІЯ ДІЙ ===
  saveAuditLog: async (log) => {
    try {
      const { data, error } = await supabase
        .from('crm_audit_logs')
        .insert({
          project_id: log.projectId || null,
          client_id: log.clientId || null,
          action_type: log.actionType,
          details: log.details
        })
        .select()
        .single();
      
      if (error) {
        console.warn("Could not save audit log:", error);
        return null;
      }
      return data;
    } catch (e) {
      console.warn("Exception while saving audit log:", e);
      return null;
    }
  },

  getAuditLogs: async (projectId) => {
    try {
      const { data, error } = await supabase
        .from('crm_audit_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn("Could not fetch audit logs:", error);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn("Exception while fetching audit logs:", e);
      return [];
    }
  },

  autoCloseProject: async (projectObj) => {
    // 1. Calculate debts
    const validPayments = (projectObj.project_payments || []).filter(p => !p.status?.toLowerCase().includes('скасовано'));
    const paidUSD = validPayments.filter(p => p.currency === 'USD').reduce((acc, p) => acc + (parseFloat(p.sum) || 0), 0);
    const paidUAH = validPayments.filter(p => p.currency === 'UAH').reduce((acc, p) => acc + (parseFloat(p.sum) || 0), 0);
    const agreedUSD = parseFloat(projectObj.agreed_sum_usd) || 0;
    const agreedUAH = parseFloat(projectObj.agreed_sum_uah) || 0;
    const debtUSD = Math.max(0, agreedUSD - paidUSD);
    const debtUAH = Math.max(0, agreedUAH - paidUAH);

    // 2. Calculate remaining materials
    const materialItems = (projectObj.project_items || []).filter(i => !i.is_service);
    const shipments = projectObj.project_shipments || [];
    
    const itemsToShip = [];
    materialItems.forEach(mi => {
      let issued = 0;
      shipments.forEach(s => {
        (s.shipment_items || []).forEach(si => {
          if (si.project_item_id === mi.id) {
            issued += parseFloat(si.quantity) || 0;
          }
        });
      });
      const remaining = (parseFloat(mi.quantity) || 0) - issued;
      if (remaining > 0) {
        itemsToShip.push({
          project_item_id: mi.id,
          quantity: remaining,
          price: parseFloat(mi.price) || 0,
          currency: mi.currency || 'USD'
        });
      }
    });

    // Auto-create final payments if there is a debt
    if (debtUSD > 0.01) {
      await crmApi.savePayment({
        project_id: projectObj.id,
        sum: Math.round(debtUSD * 100) / 100,
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
        payment_type: 'Оплата',
        note: 'Автоматичне закриття залишку боргу при завершенні угоди',
        status: 'Оплачено'
      });
    }
    if (debtUAH > 0.01) {
      await crmApi.savePayment({
        project_id: projectObj.id,
        sum: Math.round(debtUAH * 100) / 100,
        currency: 'UAH',
        date: new Date().toISOString().split('T')[0],
        payment_type: 'Оплата',
        note: 'Автоматичне закриття залишку боргу при завершенні угоди',
        status: 'Оплачено'
      });
    }

    // Auto-create final shipments if there are remaining materials
    if (itemsToShip.length > 0) {
      const shipmentData = {
        project_id: projectObj.id,
        carrier: 'Самовивіз',
        tracking_number: '-',
        date: new Date().toISOString().split('T')[0],
        note: 'Автоматичне відвантаження залишку товарів при завершенні угоди'
      };
      await crmApi.saveShipment(shipmentData, itemsToShip);
    }

    // Save to Audit Log
    const itemsCount = itemsToShip.reduce((acc, item) => acc + item.quantity, 0);
    await crmApi.saveAuditLog({
      projectId: projectObj.id,
      clientId: projectObj.client_id,
      actionType: 'Автоматичне закриття',
      details: `Автоматично проведено повний взаєморозрахунок при переході до статусу "Завершено"` +
        ((debtUSD > 0.01 || debtUAH > 0.01) ? ` (закрито борг USD: ${debtUSD.toFixed(2)}, UAH: ${debtUAH.toFixed(2)})` : '') +
        (itemsToShip.length > 0 ? ` та відвантажено залишок товарів у кількості ${itemsCount} шт.` : '')
    });
  },

  // === РЕЗЕРВНЕ КОПІЮВАННЯ ===
  backupCrmData: async () => {
    const [
      clientsRes,
      projectsRes,
      paymentsRes,
      itemsRes,
      shipmentsRes,
      shipmentItemsRes,
      logsRes
    ] = await Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('project_payments').select('*'),
      supabase.from('project_items').select('*'),
      supabase.from('project_shipments').select('*'),
      supabase.from('shipment_items').select('*'),
      supabase.from('crm_audit_logs').select('*')
    ]);

    if (clientsRes.error) throw clientsRes.error;
    if (projectsRes.error) throw projectsRes.error;

    return {
      exported_at: new Date().toISOString(),
      version: "1.0",
      clients: clientsRes.data || [],
      projects: projectsRes.data || [],
      payments: paymentsRes.data || [],
      project_items: itemsRes.data || [],
      shipments: shipmentsRes.data || [],
      shipment_items: shipmentItemsRes.data || [],
      audit_logs: logsRes.data || []
    };
  },

  // === ПОСТАЧАЛЬНИКИ ===
  getSuppliers: async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  saveSupplier: async (supplier) => {
    const { data, error } = await supabase
      .from('suppliers')
      .upsert({ ...supplier, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getSupplierDeals: async (supplierId) => {
    // 1. Fetch supplier deals
    const { data: deals, error: dError } = await supabase
      .from('supplier_deals')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('paid_at', { ascending: false });
    
    if (dError) throw dError;
    if (!deals || deals.length === 0) return [];

    const dealIds = deals.map(d => d.id);

    // 2. Fetch deal items and receipts
    const [itemsRes, receiptsRes] = await Promise.all([
      supabase.from('supplier_deal_items').select('*').in('deal_id', dealIds),
      supabase.from('supplier_receipts').select('*').in('deal_id', dealIds).order('received_at', { ascending: false })
    ]);

    if (itemsRes.error) throw itemsRes.error;
    if (receiptsRes.error) throw receiptsRes.error;

    const items = itemsRes.data || [];
    const receipts = receiptsRes.data || [];
    const receiptIds = receipts.map(r => r.id);

    // 3. Fetch receipt items if there are any receipts
    let receiptItems = [];
    if (receiptIds.length > 0) {
      const { data: riData, error: riError } = await supabase
        .from('supplier_receipt_items')
        .select('*')
        .in('receipt_id', receiptIds);
      if (riError) throw riError;
      receiptItems = riData || [];
    }

    // 4. Assemble
    return deals.map(d => {
      const dReceipts = receipts.filter(r => r.deal_id === d.id).map(r => ({
        ...r,
        receipt_items: receiptItems.filter(ri => ri.receipt_id === r.id)
      }));

      return {
        ...d,
        supplier_deal_items: items.filter(item => item.deal_id === d.id),
        supplier_receipts: dReceipts
      };
    });
  },

  saveSupplierDeal: async (deal, items) => {
    // 1. Save deal header
    const dealPayload = {
      supplier_id: deal.supplier_id,
      title: deal.title || 'Нова угода',
      paid_sum: parseFloat(deal.paid_sum) || 0,
      currency: deal.currency || 'USD',
      paid_at: deal.paid_at || new Date().toISOString(),
      status: deal.status || 'Активна',
      note: deal.note || '',
      updated_at: new Date().toISOString()
    };
    if (deal.id) dealPayload.id = deal.id;

    const { data: dealData, error: dealError } = await supabase
      .from('supplier_deals')
      .upsert(dealPayload)
      .select()
      .single();

    if (dealError) throw dealError;

    // 2. Save items if provided
    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => {
        const payload = {
          deal_id: dealData.id,
          name: item.name,
          quantity: parseFloat(item.quantity) || 0,
          received_quantity: parseFloat(item.received_quantity) || 0,
          unit: item.unit || 'шт.'
        };
        if (item.id) payload.id = item.id;
        return payload;
      });

      const { error: itemsError } = await supabase
        .from('supplier_deal_items')
        .upsert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return dealData;
  },

  updateSupplierDealStatus: async (dealId, status) => {
    const { data, error } = await supabase
      .from('supplier_deals')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', dealId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  saveSupplierReceipt: async (receipt, items) => {
    // 1. Create supplier receipt header
    const receiptPayload = {
      deal_id: receipt.deal_id,
      received_at: receipt.received_at || new Date().toISOString(),
      note: receipt.note || ''
    };

    const { data: receiptData, error: receiptError } = await supabase
      .from('supplier_receipts')
      .insert(receiptPayload)
      .select()
      .single();

    if (receiptError) throw receiptError;

    // 2. Save receipt items and update received_quantity in supplier_deal_items
    if (items && items.length > 0) {
      const receiptItemsToInsert = items.map(item => ({
        receipt_id: receiptData.id,
        deal_item_id: item.deal_item_id,
        quantity: parseFloat(item.quantity) || 0
      }));

      const { error: riError } = await supabase
        .from('supplier_receipt_items')
        .insert(receiptItemsToInsert);

      if (riError) throw riError;

      // Update received_quantity for each deal item
      for (const item of items) {
        // Fetch current received_quantity
        const { data: currentItem, error: fetchErr } = await supabase
          .from('supplier_deal_items')
          .select('received_quantity')
          .eq('id', item.deal_item_id)
          .single();

        if (fetchErr) throw fetchErr;

        const newReceived = (parseFloat(currentItem.received_quantity) || 0) + (parseFloat(item.quantity) || 0);

        const { error: updateErr } = await supabase
          .from('supplier_deal_items')
          .update({ received_quantity: newReceived })
          .eq('id', item.deal_item_id);

        if (updateErr) throw updateErr;
      }
    }

    return receiptData;
  },

  getAllOwedMaterials: async () => {
    // Fetch all active deals
    const { data: activeDeals, error: dError } = await supabase
      .from('supplier_deals')
      .select('id, title, supplier_id, paid_at, paid_sum, currency, suppliers(name)')
      .eq('status', 'Активна');

    if (dError) throw dError;
    if (!activeDeals || activeDeals.length === 0) return [];

    const dealIds = activeDeals.map(d => d.id);

    // Fetch all items for these active deals
    const { data: items, error: iError } = await supabase
      .from('supplier_deal_items')
      .select('*')
      .in('deal_id', dealIds);

    if (iError) throw iError;
    if (!items || items.length === 0) return [];

    // Map and aggregate
    return items.map(item => {
      const deal = activeDeals.find(d => d.id === item.deal_id);
      return {
        ...item,
        supplier_name: deal?.suppliers?.name || 'Невідомий постачальник',
        deal_title: deal?.title || 'Без назви',
        paid_at: deal?.paid_at,
        currency: deal?.currency || 'USD',
        paid_sum: parseFloat(deal?.paid_sum) || 0,
        supplier_id: deal?.supplier_id
      };
    });
  }
};

