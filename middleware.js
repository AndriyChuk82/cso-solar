import { jwtVerify } from 'jose';

// Список публічних шляхів, які доступні без входу
const PUBLIC_PATHS = [
    '/login.html',
    '/login.css',
    '/api/login',
    '/favicon.ico',
    '/assets/',
    '/api/verify',
    '/api/fetch-rates',
    '/files'
];

export const config = {
    // Запускаємо middleware для всіх шляхів, крім внутрішніх верифікацій Vercel
    matcher: ['/((?!_next/static|_next/image|settings).*)']
};

function getCookieValue(request, name) {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
        const [key, ...valueParts] = cookie.trim().split('=');
        if (key === name) return valueParts.join('=');
    }
    return null;
}

export default async function middleware(request) {
    try {
        const { pathname } = new URL(request.url);

        // 1. Дозволяємо доступ до публічних файлів та асетів
        if (
            PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p)) ||
            pathname.includes('/assets/') ||
            /\.(png|jpg|jpeg|svg|gif|ico|css|js|woff|woff2)$/i.test(pathname)
        ) {
            return undefined; // Пропускаємо далі
        }

        // 2. Отримуємо токен
        const token = getCookieValue(request, 'cso_auth_token');

        if (!token) {
            return Response.redirect(new URL('/login.html', request.url), 302);
        }

        // 3. Перевірка секрету JWT
        const secretText = process.env.SUPABASE_JWT_SECRET || 'aaM/+UccX5iYKq7AL47TRxgB00iRY37rAr7rM2DvxrHZ5Y8t4MawIHq2qezmGlrirQYnNyA6mvkojrlape38gw==';
        const secret = new TextEncoder().encode(secretText);
        
        try {
            const { payload } = await jwtVerify(token, secret, {
                algorithms: ['HS256']
            });

            // 4. Перевірка прав доступу до модулів
            const role = (payload.user_role || payload.role || 'user').trim().toLowerCase();
            const isAdmin = ['admin', 'адмін', 'адміністратор', 'administrator'].includes(role);
            const moduleAccess = (payload.module_access || '').trim().toLowerCase();

            const hasAccess = (mod) => {
                if (isAdmin) return true;
                const mapping = {
                    'proposals': ['proposals', 'кп', 'комперційні'],
                    'warehouse': ['warehouse', 'склад'],
                    'projects': ['projects', 'проєкти', 'проекти'],
                    'gt': ['gt', 'зелений тариф', 'зт'],
                    'land-lease': ['land-lease', 'оренда', 'оренда землі', 'земля'],
                    'files': ['files', 'файли', 'база', 'паспорти']
                };
                const allowed = mapping[mod] || [mod];
                return allowed.some(a => moduleAccess.includes(a));
            };

            // Функція для пошуку першого дозволеного розділу
            const getSafeRedirectUrl = () => {
                if (hasAccess('proposals')) return new URL('/proposals/', request.url);
                if (hasAccess('warehouse')) return new URL('/warehouse/', request.url);
                if (hasAccess('projects')) return new URL('/projects/', request.url);
                if (hasAccess('gt')) return new URL('/green-tariff/', request.url);
                if (hasAccess('land-lease')) return new URL('/land-lease/', request.url);
                return new URL('/dashboard/', request.url);
            };

            // Перевірка доступу до КП (/proposals або головна сторінка з КП)
            if (pathname.startsWith('/proposals')) {
                if (!hasAccess('proposals')) {
                    return Response.redirect(getSafeRedirectUrl(), 302);
                }
            }

            // Перевірка доступу до /warehouse
            if (pathname.startsWith('/warehouse')) {
                if (!hasAccess('warehouse')) {
                    return Response.redirect(getSafeRedirectUrl(), 302);
                }
            }

            // Перевірка доступу до /green-tariff та /green-tariff-v2
            if (pathname.startsWith('/green-tariff') || pathname.startsWith('/green-tariff-v2')) {
                if (!hasAccess('gt')) {
                    return Response.redirect(getSafeRedirectUrl(), 302);
                }
            }

            // Перевірка доступу до /projects
            if (pathname.startsWith('/projects')) {
                if (!hasAccess('projects')) {
                    return Response.redirect(getSafeRedirectUrl(), 302);
                }
            }

            // Перевірка доступу до /land-lease (Оренда землі)
            if (pathname.startsWith('/land-lease')) {
                if (!hasAccess('land-lease')) {
                    return Response.redirect(getSafeRedirectUrl(), 302);
                }
            }

            return undefined; // Все добре, пропускаємо
        } catch (jwtErr) {
            console.warn('JWT verification failed:', jwtErr.message);
            const response = Response.redirect(new URL('/login.html', request.url), 302);
            response.headers.set('Set-Cookie', 'cso_auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict');
            return response;
        }
    } catch (err) {
        console.error('Middleware crash:', err);
        return Response.redirect(new URL('/login.html', request.url), 302);
    }
}

