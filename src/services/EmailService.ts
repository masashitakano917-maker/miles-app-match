// src/services/EmailService.ts
// Cloudflare Pages Functions 経由で SendGrid を叩くメール送信ラッパ
// ・/api/send-email を呼ぶ（フロントから直接 SendGrid は叩かない）
// ・Reply-To ヘッダーに対応
// ・React StrictMode 等による二重実行を 2 分間の冪等化で抑止

type SendArgs = {
  to?: string;                 // 省略時は Functions 側の DEFAULT_TO_EMAIL が使われます
  subject: string;
  html: string;
  replyTo?: string;            // 返信先を明示したい場合
};

export class EmailService {
  // 重複送信抑止（2分TTL）
  private static sentCache = new Map<string, number>();
  private static readonly DEDUP_WINDOW_MS = 2 * 60 * 1000;

  // 雑にハッシュ化（本文が長くてもキーが短くなるように）
  private static hash(s: string) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
    return (h >>> 0).toString(36);
  }

  private static makeKey(args: SendArgs) {
    return `${args.to || 'default'}|${args.subject}|${this.hash(args.html)}`;
  }

  private static isDuplicate(args: SendArgs) {
    const key = this.makeKey(args);
    const now = Date.now();
    const last = this.sentCache.get(key);
    // 期限切れのキーを掃除
    for (const [k, t] of this.sentCache) if (now - t > this.DEDUP_WINDOW_MS) this.sentCache.delete(k);
    if (last && now - last < this.DEDUP_WINDOW_MS) return true;
    this.sentCache.set(key, now);
    return false;
  }

  /**
   * メール送信（/api/send-email 経由）
   * 旧シグネチャ互換: sendEmail(to, subject, htmlContent, replyTo?)
   */
  static async sendEmail(
    toOrArgs: string | SendArgs,
    subject?: string,
    htmlContent?: string,
    replyTo?: string
  ): Promise<boolean> {
    const args: SendArgs =
      typeof toOrArgs === 'string'
        ? { to: toOrArgs, subject: subject || '', html: htmlContent || '', replyTo }
        : toOrArgs;

    if (!args.subject || !args.html) {
      console.warn('[EmailService] subject / html が不足しています。送信をスキップしました。', args);
      return false;
    }

    if (this.isDuplicate(args)) {
      console.log('🛡️ [EmailService] 重複送信を抑止しました（2分以内の同一メール）:', {
        to: args.to || '(DEFAULT)',
        subject: args.subject,
      });
      return true; // 重複は成功扱いにする
    }

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Functions 側の期待に合わせて payload を作る
        body: JSON.stringify({
          ...(args.to ? { to: args.to } : {}),      // 省略時は Functions の DEFAULT_TO_EMAIL
          subject: args.subject,
          message: args.html,                        // Functions 側は message を本文として受け取る実装
          replyEmail: args.replyTo,                  // Reply-To
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`❌ メール送信失敗 (${res.status}) :`, text);
        return false;
      }

      console.log(`✅ メール送信成功 → ${args.to || '(DEFAULT)'} : ${args.subject}`);
      return true;
    } catch (e) {
      console.error('❌ メール送信エラー:', e);
      return false;
    }
  }
}
