// 実際のメール送信サービス
export class EmailService {
  private static readonly API_ENDPOINT = 'https://api.sendgrid.v3/mail/send';
  private static readonly API_KEY = import.meta.env.VITE_SENDGRID_API_KEY;

  // SendGridを使用した実際のメール送信
  static async sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    if (!this.API_KEY) {
      console.warn('SendGrid API key not configured. Email not sent.');
      return false;
    }

    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: to }],
            subject: subject
          }],
          from: { email: 'noreply@thisismerci.com', name: 'マッチングプラットフォーム' },
          content: [{
            type: 'text/html',
            value: htmlContent
          }]
        })
      });

      if (response.ok) {
        console.log(`✅ メール送信成功: ${to} - ${subject}`);
        return true;
      } else {
        const error = await response.text();
        console.error(`❌ メール送信失敗: ${response.status} - ${error}`);
        return false;
      }
    } catch (error) {
      console.error('❌ メール送信エラー:', error);
      return false;
    }
  }

  // 複数の宛先に一括送信
  static async sendBulkEmail(recipients: string[], subject: string, htmlContent: string): Promise<boolean> {
    const results = await Promise.all(
      recipients.map(email => this.sendEmail(email, subject, htmlContent))
    );
    return results.every(result => result);
  }
}