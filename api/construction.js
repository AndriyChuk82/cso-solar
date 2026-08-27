import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI1NzcwNywiZXhwIjoyMDkxODMzNzA3fQ.n63gcYyDa-C02oOu3fhz0BBeDwIRZKX6qUS44PkqGJs';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action } = req.query;

  try {
    // 1. Get all construction objects
    if (req.method === 'GET' && action === 'get_objects') {
      const { data, error } = await supabaseAdmin
        .from('construction_objects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    }

    // 2. Get object details with materials
    if (req.method === 'GET' && action === 'get_details') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing id parameter' });

      const [objRes, matRes] = await Promise.all([
        supabaseAdmin.from('construction_objects').select('*').eq('id', id).single(),
        supabaseAdmin.from('construction_object_materials').select('*').eq('object_id', id).order('sort_order', { ascending: true })
      ]);

      if (objRes.error) throw objRes.error;
      return res.status(200).json({
        success: true,
        object: objRes.data,
        materials: matRes.data || []
      });
    }

    // 3. Save / update construction object
    if (req.method === 'POST' && action === 'save_object') {
      const objectData = req.body;
      if (!objectData || !objectData.client_name) {
        return res.status(400).json({ error: 'Client name is required' });
      }

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

      const { data, error } = await supabaseAdmin
        .from('construction_objects')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    // 4. Save materials
    if (req.method === 'POST' && action === 'save_materials') {
      const { objectId, materials } = req.body || {};
      if (!objectId) return res.status(400).json({ error: 'Missing objectId' });

      // Delete existing materials
      await supabaseAdmin.from('construction_object_materials').delete().eq('object_id', objectId);

      if (materials && materials.length > 0) {
        const rows = materials.map((m, idx) => ({
          id: m.id || crypto.randomUUID(),
          object_id: objectId,
          product_id: m.product_id || null,
          product_name: m.product_name,
          unit: m.unit || 'шт.',
          planned_qty: parseFloat(m.planned_qty || 0),
          actual_qty: parseFloat(m.actual_qty || 0),
          is_custom: !!m.is_custom,
          notes: m.notes || '',
          sort_order: idx
        }));

        const { data, error } = await supabaseAdmin.from('construction_object_materials').insert(rows).select();
        if (error) throw error;
        return res.status(200).json({ success: true, data });
      }

      return res.status(200).json({ success: true, data: [] });
    }

    // 5. Delete object
    if ((req.method === 'DELETE' || req.method === 'POST') && action === 'delete_object') {
      const id = req.query.id || req.body?.id;
      if (!id) return res.status(400).json({ error: 'Missing id' });

      const { error } = await supabaseAdmin.from('construction_objects').delete().eq('id', id);
      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action or method' });
  } catch (err) {
    console.error('API Construction error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
