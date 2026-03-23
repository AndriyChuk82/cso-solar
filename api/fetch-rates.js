
export default async function handler(req, res) {
  try {
    const payload = {
      operationName: "Point",
      variables: { alias: "goverla-ua" },
      query: "query Point($alias: Alias!) { point(alias: $alias) { rates { currency { codeAlpha } bid { absolute } ask { absolute } } } }"
    };

    const response = await fetch('https://api.goverla.ua/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Goverla API error');
    
    const data = await response.json();
    const rates = data?.data?.point?.rates || [];
    
    // Extract USD and EUR (selling price 'ask')
    // They return values as integers (e.g., 4435 for 44.35)
    const usdRateObj = rates.find(r => r.currency.codeAlpha === 'USD');
    const eurRateObj = rates.find(r => r.currency.codeAlpha === 'EUR');
    
    const usd = usdRateObj ? usdRateObj.ask.absolute / 100 : 0;
    const eur = eurRateObj ? eurRateObj.ask.absolute / 100 : 0;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ success: true, usd, eur });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
