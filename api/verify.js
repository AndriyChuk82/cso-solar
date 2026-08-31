import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    const token = req.cookies?.cso_auth_token;

    if (!token) {
        return res.status(401).json({ authenticated: false });
    }

    try {
        const jwtSecretKey = process.env.SUPABASE_JWT_SECRET || 'aaM/+UccX5iYKq7AL47TRxgB00iRY37rAr7rM2DvxrHZ5Y8t4MawIHq2qezmGlrirQYnNyA6mvkojrlape38gw==';
        const secret = new TextEncoder().encode(jwtSecretKey);
        const { payload } = await jwtVerify(token, secret, {
            algorithms: ['HS256']
        });

        const userEmail = (payload.email || payload.sub || '').trim().toLowerCase();
        let name = payload.name || userEmail;
        let role = payload.user_role || payload.role || 'user';
        let warehouseId = payload.warehouse_id || payload.user_metadata?.warehouse_id || '';
        let moduleAccess = payload.module_access || '';

        // Отримуємо найсвіжіші налаштування користувача з бази Supabase
        if (userEmail) {
            try {
                const { data: dbUser, error: dbErr } = await supabaseAdmin
                    .from('users')
                    .select('id, email, name, role, warehouse_id, module_access, active')
                    .eq('email', userEmail)
                    .maybeSingle();

                if (!dbErr && dbUser) {
                    if (dbUser.active === false) {
                        return res.status(401).json({ authenticated: false, error: 'Account disabled' });
                    }
                    name = dbUser.name || name;
                    role = dbUser.role || role;
                    warehouseId = dbUser.warehouse_id || warehouseId || '';
                    moduleAccess = dbUser.module_access || moduleAccess || '';
                }
            } catch (err) {
                console.warn('Verify fetch dbUser error:', err);
            }
        }

        return res.status(200).json({ 
            authenticated: true,
            token: token,
            user: userEmail,
            name: name,
            role: role,
            warehouse_id: warehouseId,
            module_access: moduleAccess
        });
    } catch (err) {
        return res.status(401).json({ authenticated: false });
    }
}
