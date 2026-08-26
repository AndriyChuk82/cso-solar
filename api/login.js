import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI1NzcwNywiZXhwIjoyMDkxODMzNzA3fQ.n63gcYyDa-C02oOu3fhz0BBeDwIRZKX6qUS44PkqGJs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function recordAuthLog({ username, status, ip, userAgent, failureReason }) {
    try {
        await supabase.from('auth_logs').insert({
            username: username || 'Невідомий',
            status: status,
            ip_address: ip,
            user_agent: userAgent || 'Невідомий пристрій',
            failure_reason: failureReason || null,
        });
    } catch (err) {
        console.warn('Could not record auth log:', err);
    }
}

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

    // Get client IP and User Agent for logging & rate limiting
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const attempts = failedAttempts.get(ip);

    // Check lockout
    if (attempts && attempts.count >= MAX_ATTEMPTS) {
        const timeLeft = Math.ceil((LOCKOUT_MS - (Date.now() - attempts.lastAttempt)) / 1000 / 60);
        recordAuthLog({
            username: req.body?.username || 'Невідомий',
            status: 'BLOCKED',
            ip,
            userAgent,
            failureReason: `Заблоковано через перевищення ліміту (15 хв)`
        });
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

        // 2. Якщо не знайдено в ENV — шукаємо в таблиці users у Supabase
        if (!passwordMatch) {
            try {
                const { data: dbUser, error: dbErr } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', username.trim().toLowerCase())
                    .eq('active', true)
                    .maybeSingle();

                if (dbErr) {
                    console.error('Supabase query error:', dbErr);
                } else if (dbUser && dbUser.password) {
                    passwordMatch = await bcrypt.compare(password, dbUser.password);
                    if (passwordMatch) {
                        displayName = dbUser.name || username;
                        userRole = (dbUser.role || 'user').toLowerCase();
                        moduleAccess = dbUser.module_access || '';
                    }
                }
            } catch (err) {
                console.error('Supabase fetch error:', err);
            }
        }

        if (!passwordMatch) {
            // Record failed login log
            recordAuthLog({
                username,
                status: 'FAILED',
                ip,
                userAgent,
                failureReason: 'Невірний логін або пароль'
            });

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

        // Record successful login log
        recordAuthLog({
            username,
            status: 'SUCCESS',
            ip,
            userAgent,
            failureReason: null
        });

        // Створення токена, сумісного з Supabase RLS та нашою системою
        userRole = userRole.trim().toLowerCase();
        const jwtSecretKey = process.env.SUPABASE_JWT_SECRET || 'aaM/+UccX5iYKq7AL47TRxgB00iRY37rAr7rM2DvxrHZ5Y8t4MawIHq2qezmGlrirQYnNyA6mvkojrlape38gw==';
        const secret = new TextEncoder().encode(jwtSecretKey);
        const token = await new SignJWT({
            sub: username,
            email: username,
            name: displayName,
            role: 'authenticated', // Необхідно для Supabase PostgREST RLS
            user_role: userRole,   // Наша внутрішня роль (admin, user)
            aud: 'authenticated',  // Необхідно для Supabase PostgREST
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: { name: displayName, role: userRole },
            module_access: moduleAccess // Додаємо доступ до модулів у токен
        })
            .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
            .setIssuedAt()
            .setExpirationTime('7d')
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

        // Determine correct redirect URL
        let redirectUrl = '/';
        const isAdmin = ['admin', 'адмін', 'адміністратор', 'administrator'].includes(userRole.trim().toLowerCase());
        
        if (!isAdmin && moduleAccess) {
            const lowerAccess = moduleAccess.toLowerCase();
            const hasAccess = (mod) => {
                const mapping = {
                    'proposals': ['proposals', 'кп', 'комперційні'],
                    'warehouse': ['warehouse', 'склад'],
                    'projects': ['projects', 'проєкти', 'проекти'],
                    'gt': ['gt', 'зелений тариф', 'зт']
                };
                const allowed = mapping[mod] || [mod];
                return allowed.some(a => lowerAccess.includes(a));
            };

            const hasProposals = hasAccess('proposals');
            if (!hasProposals) {
                if (hasAccess('warehouse')) redirectUrl = '/warehouse/';
                else if (hasAccess('projects')) redirectUrl = '/projects/';
                else if (hasAccess('gt')) redirectUrl = '/green-tariff/';
            }
        }

        res.setHeader('Set-Cookie', cookieOptions);
        return res.status(200).json({ 
            success: true, 
            token: token,
            redirect: redirectUrl,
            user: {
                email: username,
                name: displayName,
                role: userRole,
                module_access: moduleAccess,
                isAdmin: isAdmin
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
}
