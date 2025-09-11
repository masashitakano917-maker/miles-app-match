// SendGrid Web API を使用したメール送信サービス
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
      const fromEmail = import.meta.env.VITE_FROM_EMAIL || 'no-reply@openframe.inc';
      const fromName = import.meta.env.VITE_FROM_NAME || 'Miles マッチングプラットフォーム';
      const defaultTo = import.meta.env.VITE_DEFAULT_TO_EMAIL || 'of@thisismerci.com';

      console.log('📧 [EmailService] 設定確認:');
      console.log(`   送信者: ${fromName} <${fromEmail}>`);
      console.log(`   宛先: ${Array.isArray(payload.to) ? payload.to[0] : (payload.to || defaultTo)}`);
      console.log(`   件名: ${payload.subject}`);

      // Cloudflare Pages Function を使用したメール送信
      const emailData = {
        to: Array.isArray(payload.to) ? payload.to[0] : (payload.to || defaultTo),
        subject: payload.subject,
        html: payload.html || this.generateDefaultTemplate(payload),
        replyEmail: payload.replyEmail,
        name: payload.name,
        email: payload.email,
        message: payload.message
      };

      console.log('📧 [EmailService] Cloudflare Pages Functionでメール送信中...');

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      console.log(`📧 [EmailService] Cloudflare Function レスポンス: ${response.status}`);

      if (response.ok) {
        console.log('✅ [EmailService] メール送信成功！');
        console.log(`   実際に ${emailData.to} にメールが送信されました`);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ [EmailService] Cloudflare Function エラー:', response.status, errorText);
        
        // APIエラーの詳細を解析
        try {
          const errorData = JSON.parse(errorText);
          console.error('❌ [EmailService] エラー詳細:', errorData);
        } catch (e) {
          console.error('❌ [EmailService] エラーレスポンス解析失敗:', errorText);
        }
        
        return false;
      }

    } catch (error: any) {
      console.error("❌ [EmailService] メール送信エラー:", error);
      return false;
    }
  }

  /** シミュレーションモードでのメール送信 */
  private static async simulateEmailSending(
    payload: SendEmailPayload, 
    fromEmail: string, 
    fromName: string, 
    defaultTo: string
  ): Promise<void> {
    console.log('📧 ==================== メール送信シミュレーション ====================');
    console.log(`📤 送信者: ${fromName} <${fromEmail}>`);
    console.log(`📥 宛先: ${Array.isArray(payload.to) ? payload.to[0] : (payload.to || defaultTo)}`);
    console.log(`📋 件名: ${payload.subject}`);
    
    if (payload.replyEmail) {
      console.log(`↩️ 返信先: ${payload.replyEmail}`);
    }
    
    console.log('📄 内容:');
    if (payload.html) {
      console.log(payload.html.substring(0, 500) + (payload.html.length > 500 ? '...' : ''));
    } else if (payload.message) {
      console.log(`   メッセージ: ${payload.message}`);
    } else {
      console.log('   デフォルトテンプレートを使用');
    }
    
    // 送信遅延をシミュレート
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('✅ メール送信完了（シミュレーション）');
    console.log('📧 ================================================================');
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
          body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #f97316, #ea580c); 
            color: white; 
            padding: 30px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
          }
          .content { 
            padding: 30px; 
          }
          .footer { 
            background: #f9fafb; 
            padding: 20px; 
            text-align: center; 
            color: #6b7280; 
            font-size: 14px; 
            border-top: 1px solid #e5e7eb;
          }
          .button { 
            display: inline-block; 
            background: #f97316; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
            font-weight: bold;
          }
          .highlight {
            background: #fef3c7;
            padding: 15px;
            border-left: 4px solid #f59e0b;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Miles マッチングプラットフォーム</h1>
          </div>
          <div class="content">
            ${payload.name ? `<p>こんにちは、<strong>${payload.name}</strong>様</p>` : '<p>いつもお世話になっております。</p>'}
            
            ${payload.message ? `
              <div class="highlight">
                <p><strong>メッセージ:</strong></p>
                <p>${payload.message}</p>
              </div>
            ` : '<p>重要なお知らせがあります。</p>'}
            
            <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
            
            <p>今後ともよろしくお願いいたします。</p>
          </div>
          <div class="footer">
            <p><strong>Miles マッチングプラットフォーム</strong></p>
            <p>このメールは自動送信されています。</p>
            <p>お問い合わせ: ${import.meta.env.VITE_FROM_EMAIL || 'no-reply@openframe.inc'}</p>
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
        config[varName] = value;
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
    
    console.log(`🧪 [EmailService] テストメール送信開始: ${testTo}`);
    
    const result = await this.send({
      to: testTo,
      subject: '🧪 Miles プラットフォーム - テストメール送信',
      name: 'テストユーザー',
      html: `
        <h2>🎉 テストメール送信成功！</h2>
        <p>SendGridの設定が正常に動作しています。</p>
        
        <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>📊 送信情報</h3>
          <ul>
            <li><strong>送信日時:</strong> ${new Date().toLocaleString('ja-JP')}</li>
            <li><strong>送信者:</strong> ${import.meta.env.VITE_FROM_NAME} &lt;${import.meta.env.VITE_FROM_EMAIL}&gt;</li>
            <li><strong>宛先:</strong> ${testTo}</li>
            <li><strong>API設定:</strong> 有効</li>
          </ul>
        </div>
        
        <p>このメールが届いていれば、メール機能は正常に動作しています。</p>
        
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
          <p><strong>✅ 設定完了</strong></p>
          <p>プラットフォームのメール通知機能が正常に動作します。</p>
        </div>
      `
    });
    
    if (result) {
      console.log('✅ [EmailService] テストメール送信完了');
    } else {
      console.log('❌ [EmailService] テストメール送信失敗');
    }
    
    return result;
  }
}