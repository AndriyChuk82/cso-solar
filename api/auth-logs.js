import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Only GET allowed
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verify authentication
  const token = req.cookies?.cso_auth_token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let payload;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const result = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    payload = result.payload;
  } catch {
    return res.status(401).json({ error: 'Invalid session' });
  }

  // 2. Verify Admin Role
  const role = (payload.role || '').toLowerCase();
  const isAdmin = ['admin', 'адмін', 'адміністратор', 'administrator'].includes(role);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Доступ заборонено: потрібні права адміністратора' });
  }

  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const { data, error } = await supabaseAdmin
      .from('auth_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 500));

    if (error) {
      console.error('Error fetching auth_logs:', error);
      return res.status(500).json({ error: 'Помилка отримання логів' });
    }

    return res.status(200).json({ success: true, logs: data || [] });
  } catch (err) {
    console.error('auth-logs API error:', err);
    return res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
}
