import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/login.html', '/login.css', '/api/login', '/favicon.ico'];

export const config = {
    matcher: ['/((?!_next/static|_next/image).*)']
};

export default async function middleware(request) {
    const { pathname } = new URL(request.url);

    // Allow public paths
    if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p))) {
        return undefined; // pass through
    }

    // Check auth cookie
    const token = request.cookies?.get('cso_auth_token')?.value;

    if (!token) {
        return Response.redirect(new URL('/login.html', request.url), 302);
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(token, secret, {
            algorithms: ['HS256']
        });
        return undefined; // pass through — authenticated
    } catch (err) {
        // Invalid or expired token
        const response = Response.redirect(new URL('/login.html', request.url), 302);
        // Clear invalid cookie
        response.headers.set('Set-Cookie', 'cso_auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict');
        return response;
    }
}
