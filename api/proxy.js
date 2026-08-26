import { jwtVerify } from 'jose';

export default async function handler(req, res) {
  // Only GET allowed
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verify authentication
  const token = req.cookies?.cso_auth_token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL query parameter is required' });
  }

  let targetUrl;
  try {
    targetUrl = decodeURIComponent(url);
    const parsed = new URL(targetUrl);

    // 2. Strict Hostname Validation (SSRF Prevention)
    const isGoogleHost = 
      parsed.hostname === 'google.com' ||
      parsed.hostname.endsWith('.google.com') ||
      parsed.hostname === 'googleusercontent.com' ||
      parsed.hostname.endsWith('.googleusercontent.com');

    if (!isGoogleHost || !['https:', 'http:'].includes(parsed.protocol)) {
      return res.status(403).json({ error: 'Invalid proxy target host' });
    }
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    console.log(`Proxying request to: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      console.error(`Target returned status: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        error: `Target returned error: ${response.statusText}`,
        status: response.status 
      });
    }

    const data = await response.text();
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Return the data
    return res.status(200).send(data);
  } catch (error) {
    console.error('Proxy crash:', error);
    return res.status(500).json({ error: 'Proxy fetch failed', details: error.message });
  }
}

