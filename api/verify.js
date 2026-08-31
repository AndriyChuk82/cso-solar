import { jwtVerify } from 'jose';

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

        return res.status(200).json({ 
            authenticated: true,
            token: token,
            user: payload.email || payload.sub,
            name: payload.name || payload.email || payload.sub,
            role: payload.user_role || payload.role || 'user',
            warehouse_id: payload.warehouse_id || payload.user_metadata?.warehouse_id || '',
            module_access: payload.module_access || ''
        });
    } catch (err) {
        return res.status(401).json({ authenticated: false });
    }
}
