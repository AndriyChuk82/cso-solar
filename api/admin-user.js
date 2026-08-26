import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    // Only POST allowed
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify authentication
    const token = req.cookies?.cso_auth_token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    let payload;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const result = await jwtVerify(token, secret);
        payload = result.payload;
    } catch (e) {
        return res.status(401).json({ error: 'Invalid session' });
    }

    // 2. Strict Admin Role Check (Prevents BFLA / Privilege Escalation)
    const callerRole = (payload.role || '').toLowerCase();
    const isAdmin = ['admin', 'адмін', 'адміністратор', 'administrator'].includes(callerRole);
    if (!isAdmin) {
        return res.status(403).json({ error: 'Доступ заборонено: потрібні права адміністратора' });
    }

    const { action, userData } = req.body;

    try {
        if (action === 'addUser' || action === 'updateUser') {
            if (!userData || !userData.email) {
                return res.status(400).json({ error: 'Email користувача обов’язковий' });
            }

            const finalData = {
                email: userData.email.trim().toLowerCase(),
                name: userData.name || userData.email,
                role: (userData.role || 'user').trim().toLowerCase(),
                warehouse_id: userData.warehouse_id || '',
                project_access: userData.project_access || '',
                module_access: userData.module_access || '',
                active: userData.active !== undefined ? Boolean(userData.active) : true,
                updated_at: new Date()
            };

            // Хешуємо пароль тільки якщо він переданий
            if (userData.password) {
                finalData.password = await bcrypt.hash(userData.password, 10);
            }

            const { data, error } = await supabaseAdmin
                .from('users')
                .upsert(finalData, { onConflict: 'email' })
                .select('id, email, name, role, warehouse_id, project_access, module_access, active, created_at, updated_at')
                .single();

            if (error) throw error;
            return res.status(200).json({ success: true, user: data });
        }

        return res.status(400).json({ error: 'Invalid action' });
    } catch (err) {
        console.error('Manage user error:', err);
        return res.status(500).json({ error: err.message });
    }
}

