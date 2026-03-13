export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

import { jwtVerify } from 'jose';

// Verify auth before processing
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

    // Check authentication
    if (!(await verifyAuth(req))) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        return res.status(500).json({ error: 'Telegram token not configured' });
    }

    try {
        const { action, chatId, text, parseMode, caption, photoBase64, pdfBase64, filename } = req.body;
        const targetChatId = chatId || process.env.TELEGRAM_CHAT_ID;

        if (!targetChatId) {
            return res.status(400).json({ error: 'Chat ID не вказано' });
        }

        let response;

        if (action === 'sendMessage') {
            response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: targetChatId,
                    text: text,
                    parse_mode: parseMode || 'HTML'
                })
            });
        } else if (action === 'sendPhoto') {
            // Convert base64 to blob
            const photoBuffer = Buffer.from(photoBase64, 'base64');
            const formData = new FormData();
            formData.append('chat_id', targetChatId);
            formData.append('photo', new Blob([photoBuffer], { type: 'image/png' }), 'proposal.png');
            if (caption) formData.append('caption', caption);

            response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
                method: 'POST',
                body: formData
            });
        } else if (action === 'sendDocument') {
            const { base64: genericBase64, contentType } = req.body;
            const docBase64 = pdfBase64 || genericBase64;
            const mimeType = contentType || 'application/pdf';
            const docBuffer = Buffer.from(docBase64, 'base64');
            const formData = new FormData();
            formData.append('chat_id', targetChatId);
            formData.append('document', new Blob([docBuffer], { type: mimeType }), filename || 'proposal.pdf');
            if (caption) formData.append('caption', caption);

            response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
                method: 'POST',
                body: formData
            });
        } else {
            return res.status(400).json({ error: 'Unknown action' });
        }

        const data = await response.json();
        
        if (!data.ok) {
            return res.status(400).json({ error: data.description || 'Telegram API error' });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Telegram proxy error:', err);
        return res.status(500).json({ error: 'Failed to send to Telegram' });
    }
}
