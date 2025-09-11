// src/services/EmailService.ts
// Client → Cloudflare Pages Functions (/api/send-email) 経由で送信するヘルパー
// ※ サーバー側の Functions で SENDGRID_API_KEY / FROM_EMAIL などを参照します。

export type SendEmailPayload = {
  /** 宛先（未指定ならサーバー側の DEFAULT_TO_EMAIL へ送信） */
  to?: string | string[];
  /** 件名（必須） */
  subject: string;
  /** HTML本文（省略時はサーバー側テンプレ） */
  html?: string;
  /** 返信先（Reply-To）にしたいメールアドレス */
  replyEmail?: string;

  // 既存フォームの値をそのまま渡したい場合に備えて任意項目を用意
  name?: string;
  email?: string;
  message?: string;
};

export class EmailService {
  private static readonly ENDPOINT = "/api/send-email";

  // 環境変数の確認
  private static checkConfig(): boolean {
    const apiKey = import.meta.env.VITE_SENDGRID_API_KEY;
    if (!apiKey || apiKey === 'demo-key') {
      console.warn('⚠️ SENDGRID_API_KEY が設定されていません。メールはコンソールに表示されます。');
      return false;
    }
    return true;
  }

  /** 単発送信（従来APIと同じ形） */
  static async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    replyEmail?: string
  ): Promise<boolean> {
    return this.send({ to, subject, html: htmlContent, replyEmail });
  }

  /** 汎用：payload をそのまま投げられる版 */
  static async send(payload: SendEmailPayload): Promise<boolean> {
    try {
      const res = await fetch(this.ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`[EmailService] failed: ${res.status} ${text}`);
        return false;
      }
      return true;
    } catch (err) {
      console.error("[EmailService] error:", err);
      return false;
    }
  }

  /** 複数宛先（1件ずつ送信） */
  static async sendBulkEmail(
    recipients: string[],
    subject: string,
    htmlContent: string,
    replyEmail?: string
  ): Promise<boolean> {
    const results = await Promise.all(
      recipients.map((to) =>
        this.send({ to, subject, html: htmlContent, replyEmail })
      )
    );
    return results.every(Boolean);
  }

  /** リマインドはサーバー側ジョブ推奨（ここでは実行しない） */
  static async sendReminderEmails(): Promise<void> {
    console.log("📅 リマインド送信はサーバー側のバッチ/スケジュールで実装してください。");
  }
}
