// Cloudflare Pages Functions: /api/distance-matrix
// 期待する入力(JSON):
// { origins: (string|AddressLike)[], destinations: (string|AddressLike)[] }
// AddressLike = { prefecture?: string; city?: string; detail?: string; }
//
// 返却(JSON): Google Distance Matrix の主要フィールドをそのまま返す
//
// 必要な環境変数:
// - GOOGLE_MAPS_API_KEY

type AddressLike = string | { prefecture?: string; city?: string; detail?: string };

function normalize(a: AddressLike): string {
  if (typeof a === 'string') return a.trim();
  const { prefecture = '', city = '', detail = '' } = a || {};
  return `${prefecture}${city}${detail}`.trim();
}

export const onRequest: PagesFunction<{ GOOGLE_MAPS_API_KEY: string }> = async ({ request, env }) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  if (!env.GOOGLE_MAPS_API_KEY) {
    return new Response(JSON.stringify({ error: 'missing GOOGLE_MAPS_API_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  const originsRaw = Array.isArray(body.origins) ? body.origins : [];
  const destinationsRaw = Array.isArray(body.destinations) ? body.destinations : [];

  const origins = originsRaw.map(normalize).filter(Boolean);
  const destinations = destinationsRaw.map(normalize).filter(Boolean);

  if (origins.length === 0 || destinations.length === 0) {
    return new Response(JSON.stringify({ error: 'origins and destinations are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  const params = new URLSearchParams({
    units: 'metric',
    origins: origins.join('|'),
    destinations: destinations.join('|'),
    key: env.GOOGLE_MAPS_API_KEY,
  });

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`;

  try {
    const gRes = await fetch(url);
    const data = await gRes.json();

    // そのまま返す（必要に応じて圧縮も可）
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }
};
