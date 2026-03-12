export default function handler(req, res) {
    // Clear auth cookie
    res.setHeader('Set-Cookie', 
        'cso_auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict'
    );
    
    // Redirect to login page
    res.writeHead(302, { Location: '/login.html' });
    res.end();
}
