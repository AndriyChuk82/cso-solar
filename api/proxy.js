
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL query parameter is required' });
  }

  // Basic security: only allow specific domains (Google Spreadsheets)
  if (!url.includes('google.com') && !url.includes('googleusercontent.com')) {
    return res.status(403).json({ error: 'Invalid proxy target URL' });
  }

  try {
    const targetUrl = decodeURIComponent(url);
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
    return res.status(200).json({ error: 'Proxy fetch failed', details: error.message });
  }
}
