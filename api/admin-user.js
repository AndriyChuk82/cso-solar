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

    // Verify authentication (cookie or Bearer token)
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = req.cookies?.cso_auth_token || bearerToken;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    let payload;
    try {
        const secretKey = process.env.SUPABASE_JWT_SECRET || 'aaM/+UccX5iYKq7AL47TRxgB00iRY37rAr7rM2DvxrHZ5Y8t4MawIHq2qezmGlrirQYnNyA6mvkojrlape38gw==';
        const secret = new TextEncoder().encode(secretKey);
        const result = await jwtVerify(token, secret);
        payload = result.payload;
    } catch (e) {
        return res.status(401).json({ error: 'Invalid session' });
    }

    // 2. Strict Admin Role Check (Prevents BFLA / Privilege Escalation)
    const callerRole = (payload.user_role || payload.role || '').toLowerCase();
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

            // Обробка прав доступу до Складу (warehouse_access)
            let formattedModuleAccess = userData.module_access || '';
            if (userData.warehouse_access !== undefined && userData.warehouse_access !== null) {
                const rawPerms = Array.isArray(userData.warehouse_access) 
                    ? userData.warehouse_access 
                    : String(userData.warehouse_access).split(',').map(s => s.trim()).filter(Boolean);
                
                // Очищаємо старі wh_perm: з module_access
                const cleanModules = formattedModuleAccess.split(',')
                    .map(s => s.trim())
                    .filter(s => s && !s.startsWith('wh_perm:') && !s.startsWith('warehouse:'));
                
                // Додаємо нові wh_perm:
                const permTags = rawPerms.map(p => `wh_perm:${p}`);
                formattedModuleAccess = [...cleanModules, ...permTags].join(',');
            }

            const finalData = {
                email: userData.email.trim().toLowerCase(),
                name: userData.name || userData.email,
                role: (userData.role || 'user').trim().toLowerCase(),
                warehouse_id: userData.warehouse_id || '',
                project_access: userData.project_access || '',
                module_access: formattedModuleAccess,
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

        if (action === 'getUsers') {
            const { data, error } = await supabaseAdmin
                .from('users')
                .select('id, email, name, role, warehouse_id, project_access, module_access, active, created_at, updated_at')
                .order('name');

            if (error) throw error;
            return res.status(200).json({ success: true, users: data || [] });
        }

        return res.status(400).json({ error: 'Invalid action' });
    } catch (err) {
        console.error('Manage user error:', err);
        return res.status(500).json({ error: err.message });
    }
}

