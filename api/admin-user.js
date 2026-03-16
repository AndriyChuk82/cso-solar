import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';

export default async function handler(req, res) {
    // Only POST allowed
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify authentication
    const token = req.cookies?.cso_auth_token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(token, secret);
    } catch (e) {
        return res.status(401).json({ error: 'Invalid session' });
    }

    const { action, userData } = req.body;
    const gasUrl = process.env.GAS_URL || 'https://script.google.com/macros/s/AKfycbxqQEMJ4vKBExxmh5-ft-UGVpU9rms4vPd9z0XgZv3b33sJDvXyZoIntOj61TVg9fLK/exec';

    try {
        if (action === 'addUser' || action === 'updateUser') {
            const finalData = { ...userData };
            
            // Якщо є пароль — хешуємо його перед відправкою в GAS
            if (userData.password) {
                finalData.password = await bcrypt.hash(userData.password, 10);
            }

            const response = await fetch(gasUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: action,
                    user: finalData
                })
            });

            const data = await response.json();
            return res.status(200).json(data);
        }

        return res.status(400).json({ error: 'Invalid action' });
    } catch (err) {
        console.error('Manage user error:', err);
        return res.status(500).json({ error: err.message });
    }
}
