// 実際のメール送信サービス
export class EmailService {
  private static readonly API_ENDPOINT = 'https://api.sendgrid.com/v3/mail/send';
  private static readonly API_KEY = import.meta.env.VITE_SENDGRID_API_KEY;

  // SendGridを使用した実際のメール送信
  static async sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    if (!this.API_KEY) {
      console.warn('SendGrid API key not configured. Simulating email send...');
      console.log(`📧 [SIMULATED EMAIL]`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${htmlContent.substring(0, 200)}...`);
      
      // シミュレーション用の遅延
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
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
        
        // エラー時もシミュレーション表示
        console.log(`📧 [FALLBACK SIMULATION]`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        return false;
      }
    } catch (error) {
      console.error('❌ メール送信エラー:', error);
      
      // エラー時もシミュレーション表示
      console.log(`📧 [ERROR FALLBACK SIMULATION]`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
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

  // リマインドメール送信（前日通知）
  static async sendReminderEmails(): Promise<void> {
    // 実際の実装では、明日の予定をデータベースから取得
    console.log('📅 リマインドメールチェック中...');
    
    // デモ用のリマインド処理
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 実際の実装では、明日予定の案件を取得してリマインドメール送信
  }
}