import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

// Rate limiting: track failed attempts per IP
const failedAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function cleanOldEntries() {
    const now = Date.now();
    for (const [ip, data] of failedAttempts) {
        if (now - data.lastAttempt > LOCKOUT_MS) {
            failedAttempts.delete(ip);
        }
    }
}

export default async function handler(req, res) {
    // Only POST allowed
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    cleanOldEntries();

    // Get client IP for rate limiting
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const attempts = failedAttempts.get(ip);

    // Check lockout
    if (attempts && attempts.count >= MAX_ATTEMPTS) {
        const timeLeft = Math.ceil((LOCKOUT_MS - (Date.now() - attempts.lastAttempt)) / 1000 / 60);
        return res.status(429).json({ 
            error: `Забагато спроб. Спробуйте через ${timeLeft} хв.`
        });
    }

    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: 'Введіть логін та пароль' });
        }

        // Length limits to prevent DoS
        if (username.length > 100 || password.length > 200) {
            return res.status(400).json({ error: 'Невірні дані' });
        }

        const usernames = (process.env.AUTH_USERNAME || '').split(',').map(u => u.trim());
        const hashes = (process.env.AUTH_PASSWORD_HASH || '').split(',').map(h => h.trim());
        const jwtSecret = process.env.JWT_SECRET;
        const gasUrl = process.env.GAS_URL || 'https://script.google.com/macros/s/AKfycbxqQEMJ4vKBExxmh5-ft-UGVpU9rms4vPd9z0XgZv3b33sJDvXyZoIntOj61TVg9fLK/exec';

        if (!jwtSecret) {
            console.error('Missing JWT_SECRET environment variable');
            return res.status(500).json({ error: 'Сервер не налаштований' });
        }

        let passwordMatch = false;
        let displayName = username;
        let userRole = 'user'; // Default role
        let moduleAccess = '';

        // 1. Спочатку перевіряємо чи це захардкоджений адмін (з ENV)
        const userIndex = usernames.findIndex(u => u.toLowerCase() === username.toLowerCase());
        if (userIndex !== -1 && hashes[userIndex]) {
            passwordMatch = await bcrypt.compare(password, hashes[userIndex]);
            if (passwordMatch) {
                userRole = 'admin';
                displayName = "Адміністратор";
                moduleAccess = 'warehouse,gt,projects,proposals'; // Hardcoded modules for admin
            }
        }

        // 2. Якщо не знайдено — шукаємо в Google Sheets
        if (!passwordMatch) {
            try {
                const gasRes = await fetch(`${gasUrl}?action=getUsersForLogin`);
                const data = await gasRes.json();
                if (data.success && data.users) {
                    const sheetUser = data.users.find(u => 
                        (u.email || '').toLowerCase() === username.toLowerCase() && 
                        u.active
                    );
                    if (sheetUser && sheetUser.password) {
                        passwordMatch = await bcrypt.compare(password, sheetUser.password);
                        if (passwordMatch) {
                            displayName = sheetUser.name || username;
                            userRole = (sheetUser.role || 'user').toLowerCase();
                            moduleAccess = sheetUser.module_access || '';
                        }
                    }
                }
            } catch (err) {
                console.error('GAS fetch error:', err);
            }
        }

        if (!passwordMatch) {
            // Track failed attempt
            const current = failedAttempts.get(ip) || { count: 0, lastAttempt: 0 };
            failedAttempts.set(ip, { 
                count: current.count + 1, 
                lastAttempt: Date.now() 
            });

            const remaining = MAX_ATTEMPTS - (current.count + 1);
            return res.status(401).json({ 
                error: remaining > 0 
                    ? `Невірний логін або пароль. Залишилось спроб: ${remaining}` 
                    : `Занадто багато спроб. Акаунт заблоковано на 15 хв.`
            });
        }

        // Success — clear failed attempts
        failedAttempts.delete(ip);

        // Створення токена
        userRole = userRole.trim().toLowerCase();
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const token = await new SignJWT({
            sub: username,
            name: displayName,
            role: userRole,
            module_access: moduleAccess // Додаємо доступ до модулів у токен
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('12h')
            .sign(secret);

        // Set HTTP-only secure cookie
        const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
        const cookieOptions = [
            `cso_auth_token=${token}`,
            'Path=/',
            'HttpOnly',
            'SameSite=Strict',
            `Max-Age=${7 * 24 * 60 * 60}`, // 7 days
            isProduction ? 'Secure' : ''
        ].filter(Boolean).join('; ');

        res.setHeader('Set-Cookie', cookieOptions);
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
}
