const reply = (statusCode, data) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });
  let body;
  try { body = JSON.parse(event.body); }
  catch { return reply(400, { error: 'Invalid JSON' }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return reply(400, { error: 'Invalid request' });
  const { address, county } = body;
  if (typeof address !== 'string' || address.trim().length < 3 || address.length > 300 ||
      typeof county !== 'string' || county.trim().length < 2 || county.length > 100) {
    return reply(400, { error: 'Provide a valid address and county' });
  }
  const toolId = process.env.ACTIONFORGE_TOOL_ID;
  const key = process.env.ACTIONFORGE_KEY;
  if (!toolId || !/^[A-Za-z0-9_-]+$/.test(toolId) || toolId === 'YOUR_TOOL_ID_HERE' || !key) {
    return reply(503, { error: 'Zoning service is not configured' });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`https://api.actionforge.com/api/invoke/${encodeURIComponent(toolId)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: address.trim(), county: county.trim() }),
      signal: controller.signal,
    });
    if (!response.ok) return reply(502, { error: 'Zoning provider request failed' });
    return reply(200, await response.json());
  } catch (error) {
    return reply(error.name === 'AbortError' ? 504 : 502, { error: 'Zoning provider unavailable' });
  } finally {
    clearTimeout(timer);
  }
};
