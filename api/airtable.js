// =============================================
// HIVE COMMAND — Airtable API Proxy
// Server-side proxy to keep API keys hidden
// Deployed as Vercel Serverless Function
// =============================================

const BASE_URL = 'https://api.airtable.com/v0';

// These are SERVER-SIDE only (no VITE_ prefix)
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const API_KEY = process.env.AIRTABLE_API_KEY;

// Simple auth check — expand with Clerk/Auth0 in Phase 3
function authenticate(req) {
  const token = req.headers['x-hive-token'];
  const validToken = process.env.HIVE_ACCESS_TOKEN;

  // If no access token is configured, allow (dev mode)
  if (!validToken) return true;

  return token === validToken;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Hive-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Auth check
  if (!authenticate(req)) {
    return res.status(401).json({ error: 'Unauthorized. Provide valid X-Hive-Token header.' });
  }

  // Check server config
  if (!API_KEY || !BASE_ID) {
    return res.status(500).json({ error: 'Airtable not configured on server. Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID env vars.' });
  }

  // Rate limiting (simple in-memory, per-IP)
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!rateLimitCheck(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Max 60 requests per minute.' });
  }

  try {
    // Extract path: /api/airtable?table=agents&recordId=rec123
    const { table, recordId, ...queryParams } = req.query;

    if (!table) {
      return res.status(400).json({ error: 'Missing "table" query parameter' });
    }

    // Build Airtable URL
    let url = `${BASE_URL}/${BASE_ID}/${encodeURIComponent(table)}`;
    if (recordId) {
      url += `/${encodeURIComponent(recordId)}`;
    }

    // Forward query params (for filters, sorts, etc.)
    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v));
      } else {
        searchParams.append(key, value);
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;

    // Forward the request to Airtable
    const fetchOptions = {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    // Forward body for POST/PATCH/DELETE
    if (['POST', 'PATCH', 'DELETE'].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    // Strip any server-side metadata before returning
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('[API Proxy] Airtable error:', err.message);
    return res.status(500).json({ error: 'Internal proxy error' });
  }
}

// ─── Simple Rate Limiter ──────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // requests per window

function rateLimitCheck(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return true;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return false;
  return true;
}
