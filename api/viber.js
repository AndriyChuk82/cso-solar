export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

import { jwtVerify } from 'jose';

async function verifyAuth(req) {
    const token = req.cookies?.cso_auth_token;
    if (!token) return false;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(token, secret, { algorithms: ['HS256'] });
        return true;
    } catch { return false; }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!(await verifyAuth(req))) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const botToken = process.env.VIBER_BOT_TOKEN;
    if (!botToken) {
        return res.status(500).json({ error: 'Viber token not configured on server' });
    }

    const { action, receiver, text } = req.body;
    const targetReceiver = receiver || process.env.VIBER_RECEIVER_ID;

    if (!targetReceiver) {
        return res.status(400).json({ error: 'Receiver ID не вказано' });
    }

    try {
        let body;

        if (action === 'sendMessage') {
            body = {
                receiver: targetReceiver,
                min_api_version: 1,
                sender: {
                    name: 'CSO Solar',
                    avatar: 'https://i.ibb.co/32JD4dc/logo.png'
                },
                type: 'text',
                text: text || ''
            };
        } else {
            return res.status(400).json({ error: 'Unknown action' });
        }

        const response = await fetch('https://chatapi.viber.com/pa/send_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Viber-Auth-Token': botToken
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        // Viber returns status 0 for success
        if (data.status !== 0) {
            return res.status(400).json({ error: data.status_message || 'Viber API error' });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Viber proxy error:', err);
        return res.status(500).json({ error: 'Failed to send to Viber' });
    }
}
