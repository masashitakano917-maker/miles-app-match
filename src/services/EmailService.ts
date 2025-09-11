import sgMail from '@sendgrid/mail';

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
  private static isInitialized = false;

  // SendGrid初期化
  private static initialize(): boolean {
    if (this.isInitialized) return true;

    const apiKey = import.meta.env.VITE_SENDGRID_API_KEY;
    if (!apiKey || apiKey === 'your_sendgrid_api_key_here') {
      console.warn('⚠️ SENDGRID_API_KEY が設定されていません。メールはコンソールに表示されます。');
      return false;
    }

    try {
      sgMail.setApiKey(apiKey);
      this.isInitialized = true;
      console.log('✅ SendGrid初期化完了');
      return true;
    } catch (error) {
      console.error('❌ SendGrid初期化エラー:', error);
      return false;
    }
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
      // SendGrid初期化チェック
      if (!this.initialize()) {
        // 開発環境用フォールバック
        console.log('📧 [EmailService] メール送信シミュレーション（SendGrid未設定）:');
        console.log(`   宛先: ${payload.to || import.meta.env.VITE_DEFAULT_TO_EMAIL || 'of@thisismerci.com'}`);
        console.log(`   件名: ${payload.subject}`);
        console.log(`   返信先: ${payload.replyEmail || 'なし'}`);
        
        if (payload.html) {
          console.log(`   内容: ${payload.html.substring(0, 200)}...`);
        } else if (payload.message) {
          console.log(`   メッセージ: ${payload.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('✅ [EmailService] メール送信完了（シミュレーション）');
        return true;
      }

      // 実際のメール送信
      const fromEmail = import.meta.env.VITE_FROM_EMAIL || 'no-reply@yourdomain.com';
      const fromName = import.meta.env.VITE_FROM_NAME || 'Miles マッチングプラットフォーム';
      const defaultTo = import.meta.env.VITE_DEFAULT_TO_EMAIL || 'of@thisismerci.com';

      const msg: any = {
        to: payload.to || defaultTo,
        from: {
          email: fromEmail,
          name: fromName
        },
        subject: payload.subject,
        html: payload.html || this.generateDefaultTemplate(payload)
      };

      // 返信先設定
      if (payload.replyEmail) {
        msg.replyTo = payload.replyEmail;
      }

      console.log(`📧 [EmailService] SendGridでメール送信中...`);
      console.log(`   宛先: ${msg.to}`);
      console.log(`   件名: ${msg.subject}`);

      const response = await sgMail.send(msg);
      
      if (response && response[0] && response[0].statusCode >= 200 && response[0].statusCode < 300) {
        console.log('✅ [EmailService] メール送信成功');
        return true;
      } else {
        console.error('❌ [EmailService] メール送信失敗:', response);
        return false;
      }

    } catch (error: any) {
      console.error("❌ [EmailService] SendGridエラー:", error);
      
      // SendGridエラーの詳細ログ
      if (error.response) {
        console.error("   ステータス:", error.response.status);
        console.error("   レスポンス:", error.response.body);
      }
      
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
    console.log(`📧 [EmailService] 一括メール送信開始: ${recipients.length}件`);
    
    const results = await Promise.all(
      recipients.map(async (to, index) => {
        console.log(`   ${index + 1}/${recipients.length}: ${to}`);
        return this.send({ to, subject, html: htmlContent, replyEmail });
      })
    );
    
    const successCount = results.filter(Boolean).length;
    console.log(`✅ [EmailService] 一括送信完了: ${successCount}/${recipients.length}件成功`);
    
    return results.every(Boolean);
  }

  /** デフォルトテンプレート生成 */
  private static generateDefaultTemplate(payload: SendEmailPayload): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${payload.subject}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Miles マッチングプラットフォーム</h1>
          </div>
          <div class="content">
            ${payload.name ? `<p>こんにちは、${payload.name}様</p>` : ''}
            ${payload.message ? `<p>${payload.message}</p>` : '<p>お知らせがあります。</p>'}
            <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
          </div>
          <div class="footer">
            <p>Miles マッチングプラットフォーム</p>
            <p>このメールは自動送信されています。</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /** 設定確認用メソッド */
  static checkConfiguration(): {
    isConfigured: boolean;
    missingVars: string[];
    config: Record<string, string>;
  } {
    const requiredVars = [
      'VITE_SENDGRID_API_KEY',
      'VITE_FROM_EMAIL',
      'VITE_FROM_NAME',
      'VITE_DEFAULT_TO_EMAIL'
    ];

    const missingVars: string[] = [];
    const config: Record<string, string> = {};

    requiredVars.forEach(varName => {
      const value = import.meta.env[varName];
      if (!value || value.includes('your_') || value.includes('yourdomain')) {
        missingVars.push(varName);
      } else {
        config[varName] = varName.includes('API_KEY') ? '***設定済み***' : value;
      }
    });

    return {
      isConfigured: missingVars.length === 0,
      missingVars,
      config
    };
  }

  /** テストメール送信 */
  static async sendTestEmail(to?: string): Promise<boolean> {
    const testTo = to || import.meta.env.VITE_DEFAULT_TO_EMAIL || 'of@thisismerci.com';
    
    return this.send({
      to: testTo,
      subject: 'Miles プラットフォーム - テストメール',
      html: `
        <h2>テストメール送信成功！</h2>
        <p>SendGridの設定が正常に動作しています。</p>
        <p>送信日時: ${new Date().toLocaleString('ja-JP')}</p>
        <p>このメールが届いていれば、メール機能は正常に動作しています。</p>
      `
    });
  }
}