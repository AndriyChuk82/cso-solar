import { supabase } from './supabaseClient';
import { getProposals } from './gasApi';

const LOCAL_STORAGE_OBJECTS_KEY = 'cso_construction_objects';
const LOCAL_STORAGE_MATERIALS_KEY = 'cso_construction_materials';

// Статуси об'єкта
export const CONSTRUCTION_STATUSES = {
  kp_sent: { label: '📋 КП передана', color: '#3b82f6', bg: '#dbeafe' },
  inspected: { label: '🔍 Оглянуто на місці', color: '#8b5cf6', bg: '#f3e8ff' },
  in_progress: { label: '🏗️ В будівництві', color: '#f59e0b', bg: '#fef3c7' },
  completed: { label: '✅ Будівництво завершено', color: '#10b981', bg: '#d1fae5' },
  paid: { label: '💰 Оплачено', color: '#059669', bg: '#ecfdf5' }
};

// Варіанти оплати
export const PAYMENT_TYPES = {
  bank_loan: 'Кредит / Банк (100% передплата)',
  cash_end: 'Готівка (в кінці будівництва)',
  cash_deposit: 'Готівка (із завдатком)',
  other: 'Інший варіант розрахунку'
};

// Хелпери локального сховища
function getLocalObjects() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_OBJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalObjects(objects) {
  localStorage.setItem(LOCAL_STORAGE_OBJECTS_KEY, JSON.stringify(objects));
}

function getLocalMaterials() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MATERIALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalMaterials(materials) {
  localStorage.setItem(LOCAL_STORAGE_MATERIALS_KEY, JSON.stringify(materials));
}

async function apiCall(action, options = {}) {
  try {
    let url = `/api/construction?action=${action}`;
    if (options.params) {
      for (const [k, v] of Object.entries(options.params)) {
        url += `&${k}=${encodeURIComponent(v)}`;
      }
    }
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success) return json;
    }
  } catch (err) {
    console.warn(`API call ${action} failed:`, err);
  }
  return null;
}

export const constructionService = {
  // Отримати всі об'єкти будівництва
  getObjects: async () => {
    const localList = getLocalObjects();
    let remoteData = null;

    // 1. Vercel API
    const apiRes = await apiCall('get_objects');
    if (apiRes && Array.isArray(apiRes.data)) {
      remoteData = apiRes.data;
    }

    // 2. Прямий виклик Supabase client
    if (!remoteData && supabase) {
      try {
        const { data, error } = await supabase
          .from('construction_objects')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          remoteData = data;
        }
      } catch (err) {
        console.warn('Supabase fetch failed, fallback to LocalStorage:', err);
      }
    }

    // 3. Авто-міграція локальних об'єктів у хмару (якщо вони були створені раніше офлайн)
    if (localList.length > 0) {
      const remoteIds = new Set((remoteData || []).map(r => String(r.id)));
      const toMigrate = localList.filter(l => l && l.id && !remoteIds.has(String(l.id)));

      if (toMigrate.length > 0) {
        for (const item of toMigrate) {
          const saved = await constructionService.saveObject(item);
          if (saved.success && saved.data) {
            if (!remoteData) remoteData = [];
            remoteData.unshift(saved.data);
          }
          const allLocalMats = getLocalMaterials();
          const objMats = allLocalMats.filter(m => String(m.object_id) === String(item.id));
          if (objMats.length > 0) {
            await constructionService.saveMaterials(item.id, objMats);
          }
        }
      }
    }

    if (remoteData) {
      saveLocalObjects(remoteData);
      return { success: true, data: remoteData };
    }

    // 4. Fallback LocalStorage
    localList.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return { success: true, data: localList };
  },

  // Отримати один об'єкт з матеріалами
  getObjectDetails: async (id) => {
    let targetObject = null;
    let targetMaterials = [];

    // 1. Vercel API
    const apiRes = await apiCall('get_details', { params: { id } });
    if (apiRes && apiRes.object) {
      targetObject = apiRes.object;
      targetMaterials = apiRes.materials || [];
    }

    // 2. Прямий Supabase
    if (!targetObject && supabase) {
      try {
        const [objRes, matRes] = await Promise.all([
          supabase.from('construction_objects').select('*').eq('id', id).single(),
          supabase.from('construction_object_materials').select('*').eq('object_id', id).order('sort_order', { ascending: true })
        ]);

        if (!objRes.error && objRes.data) {
          targetObject = objRes.data;
          targetMaterials = matRes.data || [];
        }
      } catch (err) {
        console.warn('Supabase getDetails failed, fallback to LocalStorage:', err);
      }
    }

    if (!targetObject) {
      // LocalStorage fallback
      const objects = getLocalObjects();
      targetObject = objects.find(o => String(o.id) === String(id));
      if (!targetObject) {
        return { success: false, error: 'Об\'єкт не знайдено' };
      }
      const allMats = getLocalMaterials();
      targetMaterials = allMats.filter(m => String(m.object_id) === String(id));
      targetMaterials.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }

    // Автоматична синхронізація суми з КП, якщо вона ще не заповнена
    if (targetObject && (!targetObject.total_price || targetObject.total_price === 0) && (targetObject.proposal_id || targetObject.proposal_number)) {
      try {
        const res = await getProposals();
        if (res && res.success && res.proposals) {
          const prop = res.proposals.find(p => 
            (targetObject.proposal_id && String(p.id) === String(targetObject.proposal_id)) ||
            (targetObject.proposal_number && String(p.number) === String(targetObject.proposal_number))
          );
          if (prop) {
            let calcTotal = parseFloat(prop.total || prop.totalPrice || prop.grandTotal || prop.amount || prop.sum || prop.subtotal || 0);
            if (!calcTotal && prop.items && prop.items.length > 0) {
              calcTotal = prop.items.reduce((sum, i) => {
                const p = parseFloat(i.total || (parseFloat(i.price || i.unitPrice || i.cost || 0) * parseFloat(i.quantity || i.qty || 1)));
                return sum + (isNaN(p) ? 0 : p);
              }, 0);
            }
            if (calcTotal > 0) {
              targetObject.total_price = calcTotal;
              if (prop.currency) targetObject.currency = prop.currency.toUpperCase();
              const saved = await constructionService.saveObject(targetObject);
              if (saved.success && saved.data) {
                targetObject = saved.data;
              }
            }
          }
        }
      } catch (e) {
        console.warn('Auto sync proposal total failed:', e);
      }
    }

    return { success: true, object: targetObject, materials: targetMaterials };
  },

  // Зберегти чи оновити об'єкт
  saveObject: async (objectData) => {
    const id = objectData.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const payload = {
      ...objectData,
      id,
      updated_at: now,
      created_at: objectData.created_at || now,
      currency: objectData.currency || 'USD',
      status: objectData.status || 'kp_sent',
      payment_type: objectData.payment_type || 'cash_end',
      total_price: parseFloat(objectData.total_price || 0),
      advance_amount: parseFloat(objectData.advance_amount || 0),
      paid_amount: parseFloat(objectData.paid_amount || 0)
    };

    // 1. Vercel API
    const apiRes = await apiCall('save_object', { method: 'POST', body: payload });
    if (apiRes && apiRes.data) {
      const localObjs = getLocalObjects().filter(o => o.id !== id);
      saveLocalObjects([apiRes.data, ...localObjs]);
      return { success: true, data: apiRes.data };
    }

    // 2. Прямий Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('construction_objects')
          .upsert(payload)
          .select()
          .single();

        if (!error && data) {
          const localObjs = getLocalObjects().filter(o => o.id !== id);
          saveLocalObjects([data, ...localObjs]);
          return { success: true, data };
        }
      } catch (err) {
        console.warn('Supabase saveObject failed, saving to LocalStorage:', err);
      }
    }

    const localObjs = getLocalObjects().filter(o => o.id !== id);
    saveLocalObjects([payload, ...localObjs]);
    return { success: true, data: payload };
  },

  // Зберегти список матеріалів
  saveMaterials: async (objectId, materials) => {
    // 1. Vercel API
    const apiRes = await apiCall('save_materials', { method: 'POST', body: { objectId, materials } });
    if (apiRes && apiRes.data) {
      const otherMats = getLocalMaterials().filter(m => m.object_id !== objectId);
      saveLocalMaterials([...otherMats, ...apiRes.data]);
      return { success: true, data: apiRes.data };
    }

    // 2. Прямий Supabase
    if (supabase) {
      try {
        await supabase.from('construction_object_materials').delete().eq('object_id', objectId);
        
        const formatted = materials.map((m, idx) => ({
          id: m.id || crypto.randomUUID(),
          object_id: objectId,
          product_id: m.product_id || null,
          product_name: m.product_name || 'Матеріал',
          unit: m.unit || 'шт.',
          planned_qty: parseFloat(m.planned_qty || 0),
          actual_qty: parseFloat(m.actual_qty || 0),
          is_custom: !!m.is_custom,
          notes: m.notes || '',
          sort_order: idx
        }));

        const { data, error } = await supabase
          .from('construction_object_materials')
          .insert(formatted)
          .select();

        if (!error && data) {
          const otherMats = getLocalMaterials().filter(m => m.object_id !== objectId);
          saveLocalMaterials([...otherMats, ...data]);
          return { success: true, data };
        }
      } catch (err) {
        console.warn('Supabase saveMaterials failed, saving to LocalStorage:', err);
      }
    }

    const formatted = materials.map((m, idx) => ({
      id: m.id || crypto.randomUUID(),
      object_id: objectId,
      product_id: m.product_id || null,
      product_name: m.product_name || 'Матеріал',
      unit: m.unit || 'шт.',
      planned_qty: parseFloat(m.planned_qty || 0),
      actual_qty: parseFloat(m.actual_qty || 0),
      is_custom: !!m.is_custom,
      notes: m.notes || '',
      sort_order: idx
    }));

    const otherMats = getLocalMaterials().filter(m => m.object_id !== objectId);
    saveLocalMaterials([...otherMats, ...formatted]);
    return { success: true, data: formatted };
  },

  // Оновити одну позицію фактичної кількості
  updateMaterialQty: async (materialId, objectId, actualQty) => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('construction_object_materials')
          .update({ actual_qty: parseFloat(actualQty || 0) })
          .eq('id', materialId)
          .select()
          .single();

        if (!error && data) {
          return { success: true, data };
        }
      } catch (err) {
        console.warn('Supabase updateMaterialQty error:', err);
      }
    }

    const mats = getLocalMaterials();
    const target = mats.find(m => String(m.id) === String(materialId));
    if (target) {
      target.actual_qty = parseFloat(actualQty || 0);
      saveLocalMaterials(mats);
    }
    return { success: true };
  },

  // Додати матеріали з КП
  importFromProposal: async (objectId, proposalId) => {
    try {
      const res = await getProposals();
      if (!res || !res.proposals) throw new Error('Не вдалося завантажити список КП');

      const proposal = res.proposals.find(p => String(p.id) === String(proposalId));
      if (!proposal) throw new Error('Обрану КП не знайдено');

      const items = proposal.items || [];
      const currency = (proposal.currency || 'USD').toUpperCase();
      const exchangeRate = proposal.exchangeRate || proposal.rate || 41.5;

      // Рахуємо суму КП, якщо її немає у вихідному об'єкті
      let calcTotal = parseFloat(proposal.total || proposal.totalPrice || proposal.grandTotal || proposal.amount || proposal.sum || proposal.totalAmount || 0);
      if (!calcTotal && items.length > 0) {
        calcTotal = items.reduce((sum, i) => {
          const p = parseFloat(i.price || i.unitPrice || i.cost || i.sum || i.total || 0);
          const q = parseFloat(i.quantity || i.qty || 1);
          return sum + (p * q);
        }, 0);
      }

      const advanceAmount = parseFloat(proposal.advance || proposal.deposit || proposal.advanceAmount || 0);

      // Отримуємо поточні дані об'єкта, щоб НЕ затирати телефон та адресу, якщо їх немає в КП
      const existingRes = await constructionService.getObjectDetails(objectId);
      const existingObj = existingRes?.object || {};

      const updateData = {
        ...existingObj,
        id: objectId,
        client_name: (proposal.clientName && proposal.clientName.trim()) ? proposal.clientName.trim() : (existingObj.client_name || 'Клієнт з КП'),
        phone: (proposal.clientPhone || proposal.phone || existingObj.phone || '').toString().trim(),
        address: (proposal.clientAddress || proposal.address || existingObj.address || '').toString().trim(),
        proposal_id: String(proposalId),
        proposal_number: String(proposal.number || proposalId),
        currency: currency,
        exchange_rate: exchangeRate,
        total_price: calcTotal || existingObj.total_price || 0,
        advance_amount: advanceAmount || existingObj.advance_amount || 0,
        paid_amount: parseFloat(proposal.paidAmount || existingObj.paid_amount || 0)
      };

      await constructionService.saveObject(updateData);

      // Формуємо матеріали з КП
      const materialsToInsert = items.map((item, index) => {
        const qty = parseFloat(item.quantity || item.qty || 1);
        return {
          id: crypto.randomUUID(),
          object_id: objectId,
          product_name: item.name || item.productName || 'Матеріал з КП',
          unit: item.unit || 'шт.',
          planned_qty: qty,
          actual_qty: qty, // початково факт = план
          is_custom: false,
          notes: 'Імпортовано з КП #' + (proposal.number || proposalId),
          sort_order: index
        };
      });

      await constructionService.saveMaterials(objectId, materialsToInsert);
      return { success: true, count: materialsToInsert.length };
    } catch (err) {
      console.error('Import from proposal failed:', err);
      return { success: false, error: err.message || 'Помилка імпорту з КП' };
    }
  },

  // Видалити об'єкт
  deleteObject: async (id) => {
    if (supabase) {
      try {
        await supabase.from('construction_object_materials').delete().eq('object_id', id);
        await supabase.from('construction_objects').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete error:', e);
      }
    }
    const objects = getLocalObjects().filter(o => String(o.id) !== String(id));
    saveLocalObjects(objects);

    const materials = getLocalMaterials().filter(m => String(m.object_id) !== String(id));
    saveLocalMaterials(materials);

    return { success: true };
  }
};
