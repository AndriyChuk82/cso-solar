import { jwtVerify } from 'jose';

// Список шляхів, які доступні без авторизації
const PUBLIC_PATHS = ['/login.html', '/login.css', '/api/login', '/favicon.ico', '/assets/'];

export const config = {
    // Запускаємо middleware для всіх шляхів, крім внутрішніх верифікацій Vercel
    matcher: ['/((?!_next/static|_next/image|dashboard|settings).*)']
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

        // 1. Дозволяємо доступ до публічних файлів
        if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p))) {
            return undefined; // Пропускаємо далі
        }

        // 2. Отримуємо токен
        const token = getCookieValue(request, 'cso_auth_token');

        if (!token) {
            return Response.redirect(new URL('/login.html', request.url), 302);
        }

        // 3. Перевірка секрету JWT
        const secretText = process.env.JWT_SECRET;
        if (!secretText) {
            console.error('CRITICAL: JWT_SECRET is not defined in environment variables');
            // Якщо секрет не налаштований, ми не можемо пустити користувача,
            // але й не хочемо викликати 500 помилку. Перенаправляємо на логін.
            return Response.redirect(new URL('/login.html', request.url), 302);
        }

        const secret = new TextEncoder().encode(secretText);
        
        try {
            const { payload } = await jwtVerify(token, secret, {
                algorithms: ['HS256']
            });

            // 4. Перевірка прав доступу (приклад для менеджерів)
            if (payload.role === 'manager' && pathname.startsWith('/warehouse')) {
                return Response.redirect(new URL('/', request.url), 302);
            }

            return undefined; // Все добре, пропускаємо
        } catch (jwtErr) {
            // Токен невалідний або прострочений
            console.warn('JWT verification failed:', jwtErr.message);
            const response = Response.redirect(new URL('/login.html', request.url), 302);
            response.headers.set('Set-Cookie', 'cso_auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict');
            return response;
        }
    } catch (err) {
        console.error('Middleware crash:', err);
        // В крайньому випадку теж редірект на логін
        return Response.redirect(new URL('/login.html', request.url), 302);
    }
}
