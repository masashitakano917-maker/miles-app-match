// Cloudflare Pages Functions: POST /api/send-email
type Env = {
  SENDGRID_API_KEY: string;
  FROM_EMAIL: string;         // no-reply@openframe.inc
  FROM_NAME: string;          // Miles
  DEFAULT_TO_EMAIL: string;   // of@thisismerci.com
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: cors });

function esc(s = "") {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { to, subject, html, name, email, message, replyEmail } = await request.json();

    // 返信先（本文に記載 + Reply-To ヘッダー）
    const replyTo = emailRe.test(String(replyEmail || "")) ? String(replyEmail) : undefined;

    // html 未指定時はシンプルテンプレ生成
    const bodyHtml = html ?? `
      <h2>新しいお問い合わせ</h2>
      <p><b>お名前:</b> ${esc(name)}</p>
      <p><b>メール:</b> ${esc(email)}</p>
      <p><b>本文:</b></p>
      <pre style="white-space:pre-wrap">${esc(message)}</pre>
      <hr />
      <p><b>ご返信はこちら:</b> ${
        replyTo ? `<a href="mailto:${esc(replyTo)}">${esc(replyTo)}</a>` : "(返信先未指定)"
      }</p>
    `;

    const payload: any = {
      personalizations: [
        { to: [{ email: emailRe.test(String(to || "")) ? to : env.DEFAULT_TO_EMAIL }], subject },
      ],
      from: { email: env.FROM_EMAIL, name: env.FROM_NAME },
      content: [{ type: "text/html", value: bodyHtml }],
    };
    if (replyTo) payload.reply_to = { email: replyTo };

    const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const text = await r.text();
      return new Response(JSON.stringify({ error: "sendgrid failed", detail: text }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "bad json" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
};
