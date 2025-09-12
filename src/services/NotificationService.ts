// src/services/NotificationService.ts
import type { Order, Plan, Professional } from '../types';

// Cloudflare Functions エンドポイント
const CF_SEND_EMAIL = '/api/send-email';
const CF_DISTANCE = '/api/distance-matrix';

// ===== ユーティリティ =====
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const addr = (a: Order['address'] | Professional['address']) =>
  a ? `${a.prefecture}${a.city}${a.detail}` : '';

async function postJSON<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${url} failed: ${res.status} ${txt}`);
  }
  return res.json() as Promise<T>;
}

// StrictMode の二重実行/多重クリック対策
const orderRunGuard = new Set<string>();
const sentOnceKey = (orderId: string, proId: string) => `miles:sent:${orderId}:${proId}`;

type DistanceMatrixResponse = {
  destination_addresses: string[];
  origin_addresses: string[];
  rows: { elements: { distance?: { value: number }; status: string }[] }[];
  status: string;
};

export class NotificationService {
  // ====== 公開API ======

  /** 注文時の通知（顧客/管理者 + 近い順でプロに順次通知） */
  static async sendOrderNotification(order: Order, plan: Plan): Promise<void> {
    console.log('📧 注文通知を送信中...');

    // 顧客に確認
    await this.sendEmail({
      to: order.customerEmail,
      subject: 'ご注文確認のお知らせ',
      html: this.generateOrderConfirmationEmail(order, plan),
    });
    console.log(`✅ カスタマー (${order.customerEmail}) へ送信`);

    // 管理者に通知（Cloudflare 環境側の DEFAULT_TO_EMAIL 宛）
    await this.sendEmail({
      subject: '新規注文のお知らせ',
      html: this.generateAdminOrderNotificationEmail(order, plan),
    });
    console.log('✅ 管理者へ送信');

    // ラベルで候補抽出 → 距離順で7秒間隔の順次通知
    const eligible = await this.findEligibleProfessionals(order, plan);
    await this.notifyProfessionalsSequentially(order, eligible, plan);
  }

  /** 手動アサインなど単発のマッチ通知 */
  static async sendMatchNotification(order: Order, professional: Professional): Promise<void> {
    console.log('📧 マッチング通知を送信中...');
    await this.sendEmail({
      to: order.customerEmail,
      subject: 'プロフェッショナルマッチングのお知らせ',
      html: this.generateMatchNotificationEmail(order, professional),
    });
    await this.sendEmail({
      to: professional.email,
      subject: '受注確認のお知らせ',
      html: this.generateJobAcceptanceEmail(order, professional),
      replyEmail: order.customerEmail, // 返信で顧客へ
    });
    await this.sendEmail({
      subject: 'マッチング完了のお知らせ',
      html: this.generateAdminMatchNotificationEmail(order, professional),
    });
    console.log('✅ マッチング通知完了');
  }

  /** 完了時の通知 */
  static async sendCompletionNotification(order: Order, professional: Professional): Promise<void> {
    console.log('📧 完了通知を送信中...');
    await this.sendEmail({
      to: order.customerEmail,
      subject: '作業完了のお知らせ',
      html: this.generateCompletionNotificationEmail(order, professional),
    });
    await this.sendEmail({
      to: professional.email,
      subject: '完了報告確認のお知らせ',
      html: this.generateCompletionConfirmationEmail(order, professional),
      replyEmail: order.customerEmail,
    });
    await this.sendEmail({
      subject: '作業完了報告のお知らせ',
      html: this.generateAdminCompletionNotificationEmail(order, professional),
    });
    console.log('✅ 完了通知送信完了');
  }

  /** キャンセル通知 */
  static async sendCancellationNotification(
    order: Order,
    cancellationFee: number,
    reason: string,
    cancelledBy: 'customer' | 'admin'
  ): Promise<void> {
    console.log('📧 キャンセル通知を送信中...');
    await this.sendEmail({
      to: order.customerEmail,
      subject: 'ご注文キャンセルのお知らせ',
      html: this.generateCancellationNotificationEmail(order, cancellationFee, reason),
    });
    await this.sendEmail({
      subject: 'キャンセル処理完了のお知らせ',
      html: this.generateAdminCancellationNotificationEmail(order, cancellationFee, reason, cancelledBy),
    });
    // 担当プロがいれば必要に応じて追加送信
    console.log('✅ キャンセル通知送信完了');
  }

  /** プロ登録/更新通知（本人 + 管理者） */
  static async sendProfessionalRegistrationNotification(pro: Professional, isNew = true): Promise<void> {
    console.log(`📧 プロフェッショナル${isNew ? '登録' : '更新'}通知を送信中...`);
    await this.sendEmail({
      to: pro.email,
      subject: `アカウント${isNew ? '登録' : '更新'}完了のお知らせ`,
      html: this.generateProfessionalAccountNotificationEmail(pro, isNew),
    });
    await this.sendEmail({
      subject: `プロフェッショナル${isNew ? '新規登録' : '情報更新'}のお知らせ`,
      html: this.generateAdminProfessionalNotificationEmail(pro, isNew),
    });
    console.log('✅ プロ通知送信完了');
  }

  /** カスタマー登録通知（本人 + 管理者） */
  static async sendCustomerRegistrationNotification(customer: any): Promise<void> {
    console.log('📧 カスタマー登録通知を送信中...');
    await this.sendEmail({
      to: customer.email,
      subject: 'アカウント登録完了のお知らせ',
      html: this.generateCustomerRegistrationEmail(customer),
    });
    await this.sendEmail({
      subject: 'カスタマー新規登録のお知らせ',
      html: this.generateAdminCustomerRegistrationEmail(customer),
    });
    console.log('✅ カスタマー登録通知送信完了');
  }

  /**（必要なら）個別のプロ通知 */
  static async sendProfessionalJobNotification(order: Order, plan: Plan, pro: Professional): Promise<void> {
    await this.sendEmail({
      to: pro.email,
      subject: '新規案件のお知らせ',
      html: this.generateProfessionalJobNotificationEmail(order, plan, pro),
      replyEmail: order.customerEmail,
    });
  }

  /** 近い順にプロへ「順次」通知（7秒間隔・重複防止） */
  static async notifyProfessionalsSequentially(order: Order, professionals: Professional[], plan?: Plan) {
    const runKey = order.id;
    if (orderRunGuard.has(runKey)) {
      console.log('⏭️ notify skip (already running):', runKey);
      return;
    }
    orderRunGuard.add(runKey);

    try {
      const candidates = professionals.filter(p => p.isActive && p.address && p.email);
      if (candidates.length === 0) {
        console.warn('候補プロなし');
        return;
      }

      const ranked = await this.rankByDistance(order, candidates);

      for (let i = 0; i < ranked.length; i++) {
        const { pro, distance, ok } = ranked[i];

        // 重複送信ガード
        const sKey = sentOnceKey(order.id, pro.id);
        if (sessionStorage.getItem(sKey)) {
          console.log('↩︎ already sent, skip:', pro.email);
          continue;
        }
        if (!ok || !isFinite(distance)) {
          console.log('📭 skip (distance NG):', pro.email);
          continue;
        }

        const subject = `【新着依頼】${order.customerName}様 / ${order.address.prefecture}${order.address.city}`;
        const html = this.generateProfessionalJobNotificationEmail(
          order,
          plan ?? ({ name: `${order.serviceId}/${order.planId}`, price: this.estimatePrice(order.planId) } as any),
          pro
        ) + `<p style="color:#888">※ 近い順に順次ご案内中（${i + 1}/${ranked.length}）／概算距離 ${(distance / 1000).toFixed(1)}km</p>`;

        await this.sendEmail({
          to: pro.email,
          subject,
          html,
          replyEmail: order.customerEmail, // 返信すると顧客へ飛ぶ
        });

        sessionStorage.setItem(sKey, '1');
        if (i < ranked.length - 1) await sleep(7000);
      }
    } catch (e) {
      console.error('notifyProfessionalsSequentially error:', e);
    } finally {
      orderRunGuard.delete(runKey);
    }
  }

  // ====== 内部処理 ======

  /** ラベルに基づく候補抽出 */
  private static async findEligibleProfessionals(order: Order, plan: Plan): Promise<Professional[]> {
    const { DataService } = await import('./DataService');
    const all = DataService.loadProfessionals();
    const active = all.filter(p => p.isActive);

    const eligible = active.filter(pro =>
      pro.labels && pro.labels.some((label: any) => label.name.includes(plan.name) || plan.name.includes(label.name))
    );

    console.log(`🔍 プラン「${plan.name}」に該当: ${eligible.length}名`);
    return eligible;
  }

  /** 距離行列で並び替え */
  private static async rankByDistance(order: Order, pros: Professional[]) {
    const res = await postJSON<DistanceMatrixResponse>(CF_DISTANCE, {
      origins: [order.address],
      destinations: pros.map(p => p.address),
    });
    const elements = res.rows?.[0]?.elements ?? [];
    const ranked = pros
      .map((p, i) => ({
        pro: p,
        distance: elements[i]?.distance?.value ?? Number.MAX_SAFE_INTEGER,
        ok: elements[i]?.status === 'OK',
      }))
      .sort((a, b) => a.distance - b.distance);

    console.table(
      ranked.map(r => ({
        pro: `${r.pro.name} (${r.pro.email})`,
        distance_m: r.distance,
        ok: r.ok,
      }))
    );
    return ranked;
  }

  /** Cloudflare Functions 経由のメール送信 */
  private static async sendEmail(params: { to?: string; subject: string; html: string; replyEmail?: string }) {
    try {
      const body: any = { subject: params.subject, message: params.html };
      if (params.to) body.to = params.to;
      if (params.replyEmail) body.replyEmail = params.replyEmail;

      await postJSON<{ ok: true }>(CF_SEND_EMAIL, body);
      console.log('✉️ sent:', params.to ?? '(DEFAULT_TO_EMAIL)', params.subject);
    } catch (error) {
      console.error('❌ メール送信エラー:', error);
      // 失敗時は内容をログに残す（開発用）
      console.log(`📧 Fallback log\nTo: ${params.to ?? '(DEFAULT_TO_EMAIL)'}\nSubject: ${params.subject}\n${params.html.slice(0, 200)}...`);
    }
  }

  private static estimatePrice(planId: string) {
    const prices: Record<string, number> = {
      'real-estate': 15000,
      'portrait': 12000,
      'food': 18000,
      '1ldk': 8000,
      '2ldk': 12000,
      '3ldk': 16000,
      'translation': 5000,
      'interpretation': 8000,
      'companion': 15000,
    };
    return prices[planId] ?? 0;
  }

  // ====== メールテンプレ ======
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
        <li>作業場所: ${addr(order.address)}</li>
      </ul>
      <p>プロフェッショナルのマッチングが完了次第、改めてご連絡いたします。</p>
      ${order.preferredDates ? `
        <h3>ご希望日時</h3>
        <ul>
          <li>第一希望: ${order.preferredDates.first.toLocaleDateString('ja-JP')} ${order.preferredDates.first.toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}</li>
          ${order.preferredDates.second ? `<li>第二希望: ${order.preferredDates.second.toLocaleDateString('ja-JP')} ${order.preferredDates.second.toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}</li>` : ''}
          ${order.preferredDates.third ? `<li>第三希望: ${order.preferredDates.third.toLocaleDateString('ja-JP')} ${order.preferredDates.third.toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}</li>` : ''}
        </ul>` : ''}
    `;
  }

  private static generateAdminOrderNotificationEmail(order: Order, plan: Plan): string {
    return `
      <h2>新規注文のお知らせ</h2>
      <ul>
        <li>注文ID: ${order.id}</li>
        <li>顧客: ${order.customerName} (${order.customerEmail})</li>
        <li>サービス: ${plan.name}</li>
        <li>料金: ¥${plan.price.toLocaleString()}</li>
        <li>作業場所: ${addr(order.address)}</li>
      </ul>
      <p>管理画面でプロフェッショナルのアサインを行ってください。</p>
    `;
  }

  private static generateProfessionalJobNotificationEmail(order: Order, plan: Plan, pro: Professional): string {
    return `
      <h2>新規案件のお知らせ</h2>
      <p>${pro.name} 様</p>
      <p>あなたのスキルにマッチする新しい案件があります。</p>
      <ul>
        <li>サービス: ${plan.name}</li>
        <li>料金: ¥${plan.price.toLocaleString()}</li>
        <li>作業場所: ${order.address.prefecture} ${order.address.city}</li>
      </ul>
      <p>ご興味がございましたら、このメールに返信してご連絡ください。</p>
    `;
  }

  private static generateMatchNotificationEmail(order: Order, professional: Professional): string {
    return `
      <h2>プロフェッショナルマッチング完了</h2>
      <p>${order.customerName} 様</p>
      <ul>
        <li>お名前: ${professional.name}</li>
        <li>電話番号: ${professional.phone ?? '-'}</li>
        <li>評価: ⭐ ${professional.rating}</li>
      </ul>
      <p>作業開始前に、担当者から直接ご連絡いたします。</p>
    `;
  }

  private static generateJobAcceptanceEmail(order: Order, professional: Professional): string {
    return `
      <h2>受注確認</h2>
      <p>${professional.name} 様</p>
      <ul>
        <li>注文ID: ${order.id}</li>
        <li>顧客: ${order.customerName}</li>
        <li>電話番号: ${order.customerPhone}</li>
        <li>作業場所: ${addr(order.address)}</li>
      </ul>
      <p>作業開始前に、お客様へご連絡をお願いします。</p>
    `;
  }

  private static generateAdminMatchNotificationEmail(order: Order, professional: Professional): string {
    return `
      <h2>マッチング完了</h2>
      <ul>
        <li>注文ID: ${order.id}</li>
        <li>顧客: ${order.customerName}</li>
        <li>プロフェッショナル: ${professional.name}</li>
      </ul>
    `;
  }

  private static generateCompletionNotificationEmail(order: Order, professional: Professional): string {
    return `
      <h2>作業完了のお知らせ</h2>
      <p>${order.customerName} 様</p>
      <ul>
        <li>注文ID: ${order.id}</li>
        <li>担当: ${professional.name}</li>
      </ul>
      <p>サービスにご満足いただけましたら、評価をお願いいたします。</p>
    `;
  }

  private static generateCompletionConfirmationEmail(order: Order, professional: Professional): string {
    return `
      <h2>完了報告確認</h2>
      <p>${professional.name} 様</p>
      <ul>
        <li>注文ID: ${order.id}</li>
        <li>顧客: ${order.customerName}</li>
      </ul>
      <p>お疲れさまでした。</p>
    `;
  }

  private static generateAdminCompletionNotificationEmail(order: Order, professional: Professional): string {
    return `
      <h2>作業完了報告</h2>
      <ul>
        <li>注文ID: ${order.id}</li>
        <li>顧客: ${order.customerName}</li>
        <li>プロフェッショナル: ${professional.name}</li>
      </ul>
    `;
  }

  private static generateCancellationNotificationEmail(order: Order, fee: number, reason: string): string {
    return `
      <h2>ご注文キャンセルのお知らせ</h2>
      <p>${order.customerName} 様</p>
      <ul>
        <li>注文ID: ${order.id}</li>
        <li>キャンセル料金: ¥${fee.toLocaleString()}</li>
        <li>理由: ${reason}</li>
      </ul>
    `;
  }

  private static generateAdminCancellationNotificationEmail(
    order: Order, fee: number, reason: string, cancelledBy: 'customer' | 'admin'
  ): string {
    return `
      <h2>キャンセル処理完了</h2>
      <ul>
        <li>注文ID: ${order.id}</li>
        <li>顧客: ${order.customerName}</li>
        <li>キャンセル実行者: ${cancelledBy === 'customer' ? '顧客' : '管理者'}</li>
        <li>キャンセル料金: ¥${fee.toLocaleString()}</li>
        <li>理由: ${reason}</li>
      </ul>
    `;
  }

  private static generateProfessionalAccountNotificationEmail(pro: Professional, isNew: boolean): string {
    return `
      <h2>アカウント${isNew ? '登録' : '更新'}完了</h2>
      <p>${pro.name} 様</p>
      <ul>
        <li>メール: ${pro.email}</li>
        <li>電話: ${pro.phone ?? '-'}</li>
        <li>スキル: ${pro.labels?.map(l => l.name).join(', ') || '未設定'}</li>
      </ul>
    `;
  }

  private static generateAdminProfessionalNotificationEmail(pro: Professional, isNew: boolean): string {
    return `
      <h2>プロフェッショナル${isNew ? '新規登録' : '情報更新'}</h2>
      <ul>
        <li>ID: ${pro.id}</li>
        <li>氏名: ${pro.name}</li>
        <li>メール: ${pro.email}</li>
        <li>電話: ${pro.phone ?? '-'}</li>
        <li>スキル: ${pro.labels?.map(l => l.name).join(', ') || '未設定'}</li>
        <li>状態: ${pro.isActive ? 'アクティブ' : '非アクティブ'}</li>
      </ul>
    `;
  }

  private static generateCustomerRegistrationEmail(customer: any): string {
    return `
      <h2>アカウント登録完了</h2>
      <p>${customer.name} 様</p>
      <ul>
        <li>メール: ${customer.email}</li>
        <li>電話: ${customer.phone || '未設定'}</li>
      </ul>
    `;
  }

  private static generateAdminCustomerRegistrationEmail(customer: any): string {
    return `
      <h2>カスタマー新規登録</h2>
      <ul>
        <li>ID: ${customer.id}</li>
        <li>氏名: ${customer.name}</li>
        <li>メール: ${customer.email}</li>
        <li>電話: ${customer.phone || '未設定'}</li>
      </ul>
    `;
  }
}
