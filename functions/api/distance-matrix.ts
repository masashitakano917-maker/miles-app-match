// Cloudflare Pages Functions: POST /api/distance-matrix
// Google Distance Matrix API を呼び出し、運転距離(km)を配列で返します。
type Env = {
  GOOGLE_MAPS_API_KEY: string;
};

type Address = {
  postalCode?: string;
  prefecture?: string;
  city?: string;
  detail?: string;
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: cors });

function fullAddress(a?: Address): string {
  if (!a) return '';
  const parts = [a.prefecture, a.city, a.detail].filter(Boolean);
  return parts.join(' ');
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const key = env.GOOGLE_MAPS_API_KEY;
    if (!key) {
      return new Response(JSON.stringify({ error: "missing GOOGLE_MAPS_API_KEY" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await request.json() as {
      origin: Address;
      destinations: Address[];
      mode?: "driving" | "walking" | "bicycling" | "transit";
    };

    if (!body || !body.origin || !Array.isArray(body.destinations) || body.destinations.length === 0) {
      return new Response(JSON.stringify({ error: "invalid payload" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const originStr = fullAddress(body.origin);
    const destStr = body.destinations.map(fullAddress).join("|");

    const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    url.searchParams.set("origins", originStr);
    url.searchParams.set("destinations", destStr);
    url.searchParams.set("mode", body.mode || "driving");
    url.searchParams.set("language", "ja");
    url.searchParams.set("units", "metric");
    url.searchParams.set("key", key);

    const resp = await fetch(url.toString());
    if (!resp.ok) {
      const text = await resp.text();
      return new Response(JSON.stringify({ error: `upstream ${resp.status}`, detail: text }), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    if (data.status !== "OK") {
      return new Response(JSON.stringify({ error: "google error", detail: data }), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const elements = (data.rows?.[0]?.elements || []) as Array<any>;
    const distancesKm = elements.map(el => {
      if (!el || el.status !== "OK" || !el.distance) return null;
      return Math.round((el.distance.value / 1000) * 100) / 100;
    });

    return new Response(JSON.stringify({ ok: true, distancesKm }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "bad json" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
};
