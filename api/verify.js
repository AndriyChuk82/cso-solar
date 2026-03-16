import { jwtVerify } from 'jose';

export default async function handler(req, res) {
    const token = req.cookies?.cso_auth_token;

    if (!token) {
        return res.status(401).json({ authenticated: false });
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret, {
            algorithms: ['HS256']
        });

        return res.status(200).json({ 
            authenticated: true,
            user: payload.sub,
            name: payload.name || payload.sub
        });
    } catch (err) {
        return res.status(401).json({ authenticated: false });
    }
}
