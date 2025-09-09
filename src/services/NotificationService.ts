import { Order, Plan, Professional } from '../types';

export class NotificationService {
  // 注文時の通知
  static async sendOrderNotification(order: Order, plan: Plan): Promise<void> {
    console.log('📧 注文通知を送信中...');
    
    // カスタマーへの確認メール
    console.log(`✅ カスタマー (${order.customerEmail}) に注文確認メールを送信`);
    
    // 管理者への通知
    console.log('✅ 管理者 (of@thisismerci.com) に新規注文通知を送信');
    
    // 該当するプロフェッショナルへの通知（ラベルと住所でフィルタリング）
    const eligibleProfessionals = await this.findEligibleProfessionals(order, plan);
    
    for (const professional of eligibleProfessionals) {
      console.log(`✅ プロフェッショナル (${professional.email}) に新規案件通知を送信`);
      // 実際の実装では、ここでメール送信APIを呼び出し
      // await this.sendEmail(professional.email, '新規案件のお知らせ', emailContent);
    }
    
    console.log('📧 すべての通知メールを送信完了');
  }

  // マッチング時の通知
  static async sendMatchNotification(order: Order, professional: Professional): Promise<void> {
    console.log('📧 マッチング通知を送信中...');
    
    // カスタマーへの通知
    console.log(`✅ カスタマー (${order.customerEmail}) にマッチング通知を送信`);
    
    // プロフェッショナルへの確認
    console.log(`✅ プロフェッショナル (${professional.email}) に受注確認メールを送信`);
    
    // 管理者への通知
    console.log('✅ 管理者 (of@thisismerci.com) にマッチング完了通知を送信');
    
    console.log('📧 マッチング通知メールを送信完了');
  }

  // 完了時の通知
  static async sendCompletionNotification(order: Order, professional: Professional): Promise<void> {
    console.log('📧 完了通知を送信中...');
    
    // カスタマーへの完了通知
    console.log(`✅ カスタマー (${order.customerEmail}) に作業完了通知を送信`);
    
    // プロフェッショナルへの確認
    console.log(`✅ プロフェッショナル (${professional.email}) に完了報告確認メールを送信`);
    
    // 管理者への通知
    console.log('✅ 管理者 (of@thisismerci.com) に作業完了通知を送信');
    
    console.log('📧 完了通知メールを送信完了');
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

  // 実際のメール送信（実装例）
  private static async sendEmail(to: string, subject: string, content: string): Promise<void> {
    // 実際の実装では、SendGrid、AWS SES、Nodemailerなどを使用
    console.log(`📧 メール送信: ${to} - ${subject}`);
    
    // 例: SendGridを使用した場合
    // const msg = {
    //   to: to,
    //   from: 'noreply@thisismerci.com',
    //   subject: subject,
    //   html: content,
    // };
    // await sgMail.send(msg);
  }
}