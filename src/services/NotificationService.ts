import type { Order, Plan, Professional } from '../types';
import { EmailService } from './EmailService';

export class NotificationService {
  // SendGrid / 送信者設定
  private static emailConfig = {
    apiKey: import.meta.env.VITE_SENDGRID_API_KEY || 'demo-key',
    fromEmail: import.meta.env.VITE_FROM_EMAIL || 'no-reply@openframe.inc',
    fromName: import.meta.env.VITE_FROM_NAME || 'Miles',
    adminEmail: import.meta.env.VITE_DEFAULT_TO_EMAIL || 'of@thisismerci.com'
  };

  /**
   * 新規オーダー通知
   * - ここでは「カスタマー」と「管理者」にのみ送る
   * - プロへの配信は MatchingService 側のロジックに一本化（重複防止）
   */
  static async sendOrderNotification(order: Order, plan: Plan): Promise<void> {
    console.log('📧 オーダー通知（カスタマー & 管理者）を送信中...');

    // カスタマー
    await this.safeSend(
      order.customerEmail,
      'オーダー受付のお知らせ',
      this.generateOrderConfirmationEmail(order, plan)
    );

    // 管理者
    await this.safeSend(
      this.emailConfig.adminEmail,
      '新規オーダー受付のお知らせ',
      this.generateAdminOrderNotificationEmail(order, plan)
    );

    console.log('✅ sendOrderNotification 完了（プロ配信は MatchingService に任せています）');
  }

  /** プロ登録・更新通知 */
  static async sendProfessionalRegistrationNotification(
    professional: Professional, 
    isNew: boolean = true
  ): Promise<void> {
    console.log(`📧 プロ${isNew ? '登録' : '更新'}通知を送信中...`);
    await this.safeSend(
      professional.email,
      `アカウント${isNew ? '登録' : '更新'}完了のお知らせ`,
      this.generateProfessionalAccountNotificationEmail(professional, isNew)
    );
    await this.safeSend(
      this.emailConfig.adminEmail,
      `プロフェッショナル${isNew ? '新規登録' : '情報更新'}のお知らせ`,
      this.generateAdminProfessionalNotificationEmail(professional, isNew)
    );
  }

  /** リマインド（前日） */
  static async sendReminderNotification(order: Order, professional: Professional): Promise<void> {
    console.log('📧 リマインド送信中...');
    await this.safeSend(
      order.customerEmail,
      '明日の作業予定のリマインド',
      this.generateReminderEmail(order, professional, 'customer')
    );
    await this.safeSend(
      professional.email,
      '明日の作業予定のリマインド',
      this.generateReminderEmail(order, professional, 'professional')
    );
    await this.safeSend(
      this.emailConfig.adminEmail,
      '明日の作業予定のリマインド',
      this.generateReminderEmail(order, professional, 'admin')
    );
  }

  /** マッチ完了時 */
  static async sendMatchNotification(order: Order, professional: Professional): Promise<void> {
    console.log('📧 マッチング通知送信中...');
    await this.safeSend(
      order.customerEmail,
      'プロフェッショナルのマッチング完了',
      this.generateMatchNotificationEmail(order, professional)
    );
    await this.safeSend(
      professional.email,
      '受注確認のお知らせ',
      this.generateJobAcceptanceEmail(order, professional)
    );
    await this.safeSend(
      this.emailConfig.adminEmail,
      'マッチング完了のお知らせ',
      this.generateAdminMatchNotificationEmail(order, professional)
    );
  }

  /** 完了時 */
  static async sendCompletionNotification(order: Order, professional: Professional): Promise<void> {
    console.log('📧 完了通知送信中...');
    await this.safeSend(
      order.customerEmail,
      '作業完了のお知らせ',
      this.generateCompletionNotificationEmail(order, professional)
    );
    await this.safeSend(
      professional.email,
      '完了報告確認のお知らせ',
      this.generateCompletionConfirmationEmail(order, professional)
    );
    await this.safeSend(
      this.emailConfig.adminEmail,
      '作業完了報告のお知らせ',
      this.generateAdminCompletionNotificationEmail(order, professional)
    );
  }

  /** キャンセル時（管理/顧客） */
  static async sendCancellationNotification(
    order: Order, 
    cancellationFee: number, 
    reason: string,
    cancelledBy: 'customer' | 'admin'
  ): Promise<void> {
    console.log('📧 キャンセル通知送信中...');
    await this.safeSend(
      order.customerEmail,
      'オーダーのキャンセルについて',
      this.generateCancellationNotificationEmail(order, cancellationFee, reason)
    );
    await this.safeSend(
      this.emailConfig.adminEmail,
      'キャンセル処理完了のお知らせ',
      this.generateAdminCancellationNotificationEmail(order, cancellationFee, reason, cancelledBy)
    );
  }

  /** --------- 内部ユーティリティ --------- */

  // 落ちてもオーダー処理自体は止めない安全送信
  private static async safeSend(to: string, subject: string, html: string): Promise<void> {
    try {
      const ok = await EmailService.sendEmail(to, subject, html);
      if (!ok) {
        console.log(`📧 (開発モード) to=${to} subject=${subject}`);
      }
    } catch (e) {
      console.error(`❌ メール送信エラー: ${to} - ${subject}`, e);
      // ここで throw しない（注文や画面遷移は続ける）
    }
  }

  /** --------- テンプレート --------- */

  private static generateOrderConfirmationEmail(order: Order, plan: Plan): string {
    return `
      <h2>オーダー受付</h2>
      <p>${order.customerName} 様</p>
      <p>オーダーを受け付けました。</p>
      <ul>
        <li>オーダーID: ${order.id}</li>
        <li>サービス: ${plan.name}</li>
        <li>料金: ¥${plan.price.toLocaleString()}</li>
        <li>作業場所: ${order.address.prefecture} ${order.address.city} ${order.address.detail}</li>
      </ul>
      <p>マッチングが完了次第、別途ご案内します。</p>
      ${order.preferredDates ? `
        <h3>ご希望日時</h3>
        <ul>
          <li>第一希望: ${order.preferredDates.first.toLocaleString('ja-JP')}</li>
          ${order.preferredDates.second ? `<li>第二希望: ${order.preferredDates.second.toLocaleString('ja-JP')}</li>` : ''}
          ${order.preferredDates.third ? `<li>第三希望: ${order.preferredDates.third.toLocaleString('ja-JP')}</li>` : ''}
        </ul>
      ` : ''}
    `;
  }

  private static generateAdminOrderNotificationEmail(order: Order, plan: Plan): string {
    return `
      <h2>新規オーダー</h2>
      <ul>
        <li>ID: ${order.id}</li>
        <li>顧客: ${order.customerName} (${order.customerEmail})</li>
        <li>サービス: ${plan.name}</li>
        <li>料金: ¥${plan.price.toLocaleString()}</li>
        <li>場所: ${order.address.prefecture} ${order.address.city} ${order.address.detail}</li>
      </ul>
    `;
  }

  private static generateProfessionalJobNotificationEmail(order: Order, plan: Plan, professional: Professional): string {
    return `
      <h2>新規案件のお知らせ</h2>
      <p>${professional.name} 様</p>
      <ul>
        <li>サービス: ${plan.name}</li>
        <li>料金: ¥${plan.price.toLocaleString()}</li>
        <li>場所: ${order.address.prefecture} ${order.address.city}</li>
      </ul>
    `;
  }

  private static generateMatchNotificationEmail(order: Order, professional: Professional): string {
    return `
      <h2>プロのマッチングが完了しました</h2>
      <ul>
        <li>担当: ${professional.name}</li>
        <li>電話: ${professional.phone || '-'}</li>
        <li>評価: ⭐ ${professional.rating}</li>
      </ul>
    `;
  }

  private static generateJobAcceptanceEmail(order: Order, professional: Professional): string {
    return `
      <h2>受注確認</h2>
      <ul>
        <li>オーダーID: ${order.id}</li>
        <li>顧客: ${order.customerName}</li>
        <li>電話: ${order.customerPhone || '-'}</li>
        <li>場所: ${order.address.prefecture} ${order.address.city} ${order.address.detail}</li>
      </ul>
    `;
  }

  private static generateAdminMatchNotificationEmail(order: Order, professional: Professional): string {
    return `
      <h2>マッチング完了</h2>
      <ul>
        <li>オーダーID: ${order.id}</li>
        <li>顧客: ${order.customerName}</li>
        <li>プロ: ${professional.name}</li>
      </ul>
    `;
  }

  private static generateCompletionNotificationEmail(order: Order, professional: Professional): string {
    return `
      <h2>作業完了のお知らせ</h2>
      <ul>
        <li>オーダーID: ${order.id}</li>
        <li>担当: ${professional.name}</li>
      </ul>
    `;
  }

  private static generateCompletionConfirmationEmail(order: Order, professional: Professional): string {
    return `
      <h2>完了報告確認</h2>
      <ul>
        <li>オーダーID: ${order.id}</li>
        <li>顧客: ${order.customerName}</li>
      </ul>
    `;
  }

  private static generateAdminCompletionNotificationEmail(order: Order, professional: Professional): string {
    return `
      <h2>作業完了報告</h2>
      <ul>
        <li>オーダーID: ${order.id}</li>
        <li>顧客: ${order.customerName}</li>
        <li>プロ: ${professional.name}</li>
      </ul>
    `;
  }

  private static generateCancellationNotificationEmail(order: Order, cancellationFee: number, reason: string): string {
    return `
      <h2>オーダーのキャンセル</h2>
      <ul>
        <li>オーダーID: ${order.id}</li>
        <li>キャンセル料金: ¥${cancellationFee.toLocaleString()}</li>
        <li>理由: ${reason}</li>
      </ul>
    `;
  }

  private static generateAdminCancellationNotificationEmail(
    order: Order, 
    cancellationFee: number, 
    reason: string, 
    cancelledBy: 'customer' | 'admin'
  ): string {
    return `
      <h2>キャンセル処理</h2>
      <ul>
        <li>ID: ${order.id}</li>
        <li>顧客: ${order.customerName}</li>
        <li>実行者: ${cancelledBy === 'customer' ? '顧客' : '管理者'}</li>
        <li>キャンセル料金: ¥${cancellationFee.toLocaleString()}</li>
        <li>理由: ${reason}</li>
      </ul>
    `;
  }
}
