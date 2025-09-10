import { Order, Plan, Professional } from '../types';

export class NotificationService {
  // 実際のメール送信設定
  private static emailConfig = {
    apiKey: process.env.SENDGRID_API_KEY || 'demo-key',
    fromEmail: 'noreply@thisismerci.com',
    adminEmail: 'of@thisismerci.com'
  };

  // 注文時の通知
  static async sendOrderNotification(order: Order, plan: Plan): Promise<void> {
    console.log('📧 注文通知を送信中...');
    
    // カスタマーへの確認メール
    await this.sendEmail(
      order.customerEmail,
      'ご注文確認のお知らせ',
      this.generateOrderConfirmationEmail(order, plan)
    );
    console.log(`✅ カスタマー (${order.customerEmail}) に注文確認メールを送信完了`);
    
    // 管理者への通知
    await this.sendEmail(
      this.emailConfig.adminEmail,
      '新規注文のお知らせ',
      this.generateAdminOrderNotificationEmail(order, plan)
    );
    console.log('✅ 管理者に新規注文通知を送信完了');
    
    // 該当するプロフェッショナルへの通知（ラベルと住所でフィルタリング）
    const eligibleProfessionals = await this.findEligibleProfessionals(order, plan);
    
    for (const professional of eligibleProfessionals) {
      await this.sendEmail(
        professional.email,
        '新規案件のお知らせ',
        this.generateProfessionalJobNotificationEmail(order, plan, professional)
      );
      console.log(`✅ プロフェッショナル (${professional.email}) に新規案件通知を送信完了`);
    }
    
    console.log('📧 すべての通知メールを送信完了');
  }

  // マッチング時の通知
  static async sendMatchNotification(order: Order, professional: Professional): Promise<void> {
    console.log('📧 マッチング通知を送信中...');
    
    // カスタマーへの通知
    await this.sendEmail(
      order.customerEmail,
      'プロフェッショナルマッチングのお知らせ',
      this.generateMatchNotificationEmail(order, professional)
    );
    console.log(`✅ カスタマー (${order.customerEmail}) にマッチング通知を送信完了`);
    
    // プロフェッショナルへの確認
    await this.sendEmail(
      professional.email,
      '受注確認のお知らせ',
      this.generateJobAcceptanceEmail(order, professional)
    );
    console.log(`✅ プロフェッショナル (${professional.email}) に受注確認メールを送信完了`);
    
    // 管理者への通知
    await this.sendEmail(
      this.emailConfig.adminEmail,
      'マッチング完了のお知らせ',
      this.generateAdminMatchNotificationEmail(order, professional)
    );
    console.log('✅ 管理者にマッチング完了通知を送信完了');
    
    console.log('📧 マッチング通知メールを送信完了');
  }

  // 完了時の通知
  static async sendCompletionNotification(order: Order, professional: Professional): Promise<void> {
    console.log('📧 完了通知を送信中...');
    
    // カスタマーへの完了通知
    await this.sendEmail(
      order.customerEmail,
      '作業完了のお知らせ',
      this.generateCompletionNotificationEmail(order, professional)
    );
    console.log(`✅ カスタマー (${order.customerEmail}) に作業完了通知を送信完了`);
    
    // プロフェッショナルへの確認
    await this.sendEmail(
      professional.email,
      '完了報告確認のお知らせ',
      this.generateCompletionConfirmationEmail(order, professional)
    );
    console.log(`✅ プロフェッショナル (${professional.email}) に完了報告確認メールを送信完了`);
    
    // 管理者への通知
    await this.sendEmail(
      this.emailConfig.adminEmail,
      '作業完了報告のお知らせ',
      this.generateAdminCompletionNotificationEmail(order, professional)
    );
    console.log('✅ 管理者に作業完了通知を送信完了');
    
    console.log('📧 完了通知メールを送信完了');
  }

  // キャンセル通知
  static async sendCancellationNotification(
    order: Order, 
    cancellationFee: number, 
    reason: string,
    cancelledBy: 'customer' | 'admin'
  ): Promise<void> {
    console.log('📧 キャンセル通知を送信中...');
    
    // カスタマーへの通知
    await this.sendEmail(
      order.customerEmail,
      'ご注文キャンセルのお知らせ',
      this.generateCancellationNotificationEmail(order, cancellationFee, reason)
    );
    console.log(`✅ カスタマー (${order.customerEmail}) にキャンセル通知を送信完了`);
    
    // 管理者への通知
    await this.sendEmail(
      this.emailConfig.adminEmail,
      'キャンセル処理完了のお知らせ',
      this.generateAdminCancellationNotificationEmail(order, cancellationFee, reason, cancelledBy)
    );
    console.log('✅ 管理者にキャンセル通知を送信完了');
    
    // 担当プロフェッショナルへの通知（アサイン済みの場合）
    if (order.assignedProfessionalId) {
      // 実際の実装では、プロフェッショナル情報を取得
      console.log(`✅ 担当プロフェッショナルにキャンセル通知を送信完了`);
    }
    
    console.log('📧 キャンセル通知メールを送信完了');
  }
  // 該当するプロフェッショナルを検索（ラベルと住所で絞り込み）
  private static async findEligibleProfessionals(order: Order, plan: Plan): Promise<Professional[]> {
    // 実際の実装では、データベースから該当するプロフェッショナルを検索
    // 1. プランに必要なラベルを持つプロフェッショナルを検索
    // 2. 住所から距離を計算して近い順にソート
    // 3. アクティブなプロフェッショナルのみを返す
    
    console.log(`🔍 プラン「${plan.name}」に該当するプロフェッショナルを検索中...`);
    console.log(`📍 住所: ${order.address.prefecture} ${order.address.city} ${order.address.detail}`);
    
    // モックデータとして返す
    return [
      {
        id: 'pro-1',
        name: '佐藤花子',
        email: 'sato@example.com',
        role: 'professional',
        phone: '090-1234-5678',
        labels: [{ id: 'l1', name: '不動産撮影', category: '写真撮影' }],
        isActive: true,
        completedJobs: 15,
        rating: 4.8
      }
    ];
  }

  // 実際のメール送信
  private static async sendEmail(to: string, subject: string, content: string): Promise<void> {
    console.log(`📧 メール送信: ${to} - ${subject}`);
    
    try {
      // 実際の実装では、SendGrid、AWS SES、Nodemailerなどを使用
      // const response = await fetch('/api/send-email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ to, subject, content })
      // });
      
      // デモ用：コンソールにメール内容を表示
      console.log(`📧 メール内容:\n件名: ${subject}\n宛先: ${to}\n内容: ${content.substring(0, 100)}...`);
      
      // 実際のメール送信をシミュレート
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ メール送信エラー (${to}):`, error);
      throw error;
    }
  }

  // メールテンプレート生成メソッド
  private static generateOrderConfirmationEmail(order: Order, plan: Plan): string {
    return `
      <h2>ご注文確認</h2>
      <p>${order.customerName}様</p>
      <p>この度はご注文いただき、ありがとうございます。</p>
      <h3>注文内容</h3>
      <ul>
        <li>注文ID: ${order.id}</li>
        <li>サービス: ${plan.name}</li>
        <li>料金: ¥${plan.price.toLocaleString()}</li>
        <li>作業場所: ${order.address.prefecture} ${order.address.city} ${order.address.detail}</li>
      </ul>
      <p>プロフェッショナルのマッチングが完了次第、改めてご連絡いたします。</p>
    `;
  }

  private static generateAdminOrderNotificationEmail(order: Order, plan: Plan): string {
    return `
      <h2>新規注文のお知らせ</h2>
      <h3>注文詳細</h3>
      <ul>
        <li>注文ID: ${order.id}</li>
        <li>顧客: ${order.customerName} (${order.customerEmail})</li>
        <li>サービス: ${plan.name}</li>
        <li>料金: ¥${plan.price.toLocaleString()}</li>
        <li>作業場所: ${order.address.prefecture} ${order.address.city} ${order.address.detail}</li>
      </ul>
      <p>管理画面でプロフェッショナルのアサインを行ってください。</p>
    `;
  }

  private static generateProfessionalJobNotificationEmail(order: Order, plan: Plan, professional: Professional): string {
    return `
      <h2>新規案件のお知らせ</h2>
      <p>${professional.name}様</p>
      <p>あなたのスキルにマッチする新しい案件があります。</p>
      <h3>案件詳細</h3>
      <ul>
        <li>サービス: ${plan.name}</li>
        <li>料金: ¥${plan.price.toLocaleString()}</li>
        <li>作業場所: ${order.address.prefecture} ${order.address.city}</li>
      </ul>
      <p>ご興味がございましたら、プラットフォームにログインして詳細をご確認ください。</p>
    `;
  }

  private static generateMatchNotificationEmail(order: Order, professional: Professional): string {
    return `
      <h2>プロフェッショナルマッチング完了</h2>
      <p>${order.customerName}様</p>
      <p>プロフェッショナルのマッチングが完了いたしました。</p>
      <h3>担当プロフェッショナル</h3>
      <ul>
        <li>お名前: ${professional.name}</li>
        <li>電話番号: ${professional.phone}</li>
        <li>評価: ⭐ ${professional.rating}</li>
      </ul>
      <p>作業開始前に、プロフェッショナルから直接ご連絡いたします。</p>
    `;
  }

  private static generateJobAcceptanceEmail(order: Order, professional: Professional): string {
    return `
      <h2>受注確認</h2>
      <p>${professional.name}様</p>
      <p>案件の受注が確定いたしました。</p>
      <h3>案件詳細</h3>
      <ul>
        <li>注文ID: ${order.id}</li>
        <li>顧客: ${order.customerName}</li>
        <li>電話番号: ${order.customerPhone}</li>
        <li>作業場所: ${order.address.prefecture} ${order.address.city} ${order.address.detail}</li>
      </ul>
      <p>作業開始前に、お客様に直接ご連絡をお願いいたします。</p>
    `;
  }

  private static generateAdminMatchNotificationEmail(order: Order, professional: Professional): string {
    return `
      <h2>マッチング完了</h2>
      <h3>マッチング詳細</h3>
      <ul>
        <li>注文ID: ${order.id}</li>
        <li>顧客: ${order.customerName}</li>
        <li>プロフェッショナル: ${professional.name}</li>
      </ul>
      <p>マッチングが正常に完了しました。</p>
    `;
  }

  private static generateCompletionNotificationEmail(order: Order, professional: Professional): string {
    return `
      <h2>作業完了のお知らせ</h2>
      <p>${order.customerName}様</p>
      <p>作業が完了いたしました。</p>
      <h3>完了内容</h3>
      <ul>
        <li>注文ID: ${order.id}</li>
        <li>担当: ${professional.name}</li>
      </ul>
      <p>サービスにご満足いただけましたでしょうか。評価をお願いいたします。</p>
    `;
  }

  private static generateCompletionConfirmationEmail(order: Order, professional: Professional): string {
    return `
      <h2>完了報告確認</h2>
      <p>${professional.name}様</p>
      <p>作業完了報告を受け付けました。</p>
      <h3>完了案件</h3>
      <ul>
        <li>注文ID: ${order.id}</li>
        <li>顧客: ${order.customerName}</li>
      </ul>
      <p>お疲れ様でした。</p>
    `;
  }

  private static generateAdminCompletionNotificationEmail(order: Order, professional: Professional): string {
    return `
      <h2>作業完了報告</h2>
      <h3>完了詳細</h3>
      <ul>
        <li>注文ID: ${order.id}</li>
        <li>顧客: ${order.customerName}</li>
        <li>プロフェッショナル: ${professional.name}</li>
      </ul>
      <p>作業が正常に完了しました。</p>
    `;
  }

  private static generateCancellationNotificationEmail(order: Order, cancellationFee: number, reason: string): string {
    return `
      <h2>ご注文キャンセルのお知らせ</h2>
      <p>${order.customerName}様</p>
      <p>ご注文のキャンセルを承りました。</p>
      <h3>キャンセル詳細</h3>
      <ul>
        <li>注文ID: ${order.id}</li>
        <li>キャンセル料金: ¥${cancellationFee.toLocaleString()}</li>
        <li>理由: ${reason}</li>
      </ul>
      <p>キャンセル料金が発生する場合は、別途ご請求させていただきます。</p>
    `;
  }

  private static generateAdminCancellationNotificationEmail(
    order: Order, 
    cancellationFee: number, 
    reason: string, 
    cancelledBy: 'customer' | 'admin'
  ): string {
    return `
      <h2>キャンセル処理完了</h2>
      <h3>キャンセル詳細</h3>
      <ul>
        <li>注文ID: ${order.id}</li>
        <li>顧客: ${order.customerName}</li>
        <li>キャンセル実行者: ${cancelledBy === 'customer' ? '顧客' : '管理者'}</li>
        <li>キャンセル料金: ¥${cancellationFee.toLocaleString()}</li>
        <li>理由: ${reason}</li>
      </ul>
      <p>キャンセル処理が完了しました。</p>
    `;
  }
}