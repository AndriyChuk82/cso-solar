import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Дозволяємо CORS запити з вашого ж домену
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  try {
    const query = `query Point($alias: Alias!) { point(alias: $alias) { rates { currency { codeAlpha } ask { absolute } } } }`;
    const variables = { alias: "goverla-ua" };

    const hoverlaRes = await fetch('https://api.goverla.ua/graphql', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://goverla.ua/'
      },
      body: JSON.stringify({ query, variables })
    });

    if (!hoverlaRes.ok) {
      throw new Error(`Hoverla API error: ${hoverlaRes.status}`);
    }

    const data = await hoverlaRes.json();
    const rates = data?.data?.point?.rates;

    if (!rates) {
      return response.status(404).json({ error: 'Rates not found in Hoverla response' });
    }

    const usd = rates.find((r: any) => r.currency.codeAlpha === 'USD')?.ask.absolute / 100;
    const eur = rates.find((r: any) => r.currency.codeAlpha === 'EUR')?.ask.absolute / 100;

    return response.status(200).json({ usd, eur, source: 'vercel_proxy' });
  } catch (error: any) {
    return response.status(500).json({ error: error.message });
  }
}
