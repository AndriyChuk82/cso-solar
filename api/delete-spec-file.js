import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI1NzcwNywiZXhwIjoyMDkxODMzNzA3fQ.n63gcYyDa-C02oOu3fhz0BBeDwIRZKX6qUS44PkqGJs';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verify authentication (Cookie or Bearer Token)
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = req.cookies?.cso_auth_token || bearerToken;

  if (!token) {
    return res.status(401).json({ error: 'Неавторизовано: відсутній токен доступу' });
  }

  try {
    const secretKey = process.env.SUPABASE_JWT_SECRET || 'aaM/+UccX5iYKq7AL47TRxgB00iRY37rAr7rM2DvxrHZ5Y8t4MawIHq2qezmGlrirQYnNyA6mvkojrlape38gw==';
    const secret = new TextEncoder().encode(secretKey);
    await jwtVerify(token, secret, { algorithms: ['HS256'] });
  } catch (err) {
    return res.status(401).json({ error: 'Сесія недійсна або застаріла' });
  }

  const { fileName } = req.body || {};
  if (!fileName || typeof fileName !== 'string') {
    return res.status(400).json({ error: 'fileName обов\'язковий' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .storage
      .from('equipment-specs')
      .remove([fileName]);

    if (error) {
      console.error('Error removing spec file:', error);
      return res.status(500).json({ error: error.message || 'Помилка видалення файлу' });
    }

    return res.status(200).json({ success: true, deleted: data });
  } catch (err) {
    console.error('Server error deleting spec file:', err);
    return res.status(500).json({ error: err.message || 'Внутрішня помилка сервера' });
  }
}
