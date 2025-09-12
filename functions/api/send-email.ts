// Cloudflare Pages Functions: /api/send-email
// 期待する入力(JSON):
// { subject: string, message: string, replyEmail?: string, to?: string }
//
// 必要な環境変数(Cloudflare Pages → Settings → Variables)
// - SENDGRID_API_KEY (Secret/Plaintext どちらでもOK)
// - FROM_EMAIL        例: no-reply@openframe.inc
// - FROM_NAME         例: Miles
// - DEFAULT_TO_EMAIL  例: of@thisismerci.com

export const onRequest: PagesFunction<{
  SENDGRID_API_KEY: string;
  FROM_EMAIL: string;
  FROM_NAME: string;
  DEFAULT_TO_EMAIL: string;
}> = async ({ request, env }) => {
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

  if (!env.SENDGRID_API_KEY || !env.FROM_EMAIL || !env.FROM_NAME || !env.DEFAULT_TO_EMAIL) {
    return new Response(JSON.stringify({ error: 'Missing email environment variables' }), {
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

  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();
  const replyTo = body.replyEmail ? String(body.replyEmail).trim() : undefined;
  const toEmail = String(body.to || env.DEFAULT_TO_EMAIL).trim();

  if (!subject || !message) {
    return new Response(JSON.stringify({ error: 'subject and message are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  const payload = {
    personalizations: [{ to: [{ email: toEmail }], subject }],
    from: { email: env.FROM_EMAIL, name: env.FROM_NAME },
    ...(replyTo ? { reply_to: { email: replyTo } } : {}),
    content: [{ type: 'text/html', value: message }],
  };

  try {
    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!sgRes.ok) {
      const text = await sgRes.text();
      return new Response(JSON.stringify({ ok: false, error: text || sgRes.statusText }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }
};
