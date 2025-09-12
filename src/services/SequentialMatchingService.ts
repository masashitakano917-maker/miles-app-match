// src/services/SequentialMatchingService.ts
// 距離順（近い順）に “順番に” プロへ通知するマッチング制御
// ・Cloudflare Functions /api/distance-matrix で距離を取得
// ・1人に送って WAIT_MINUTES 待ち、未確定なら次の人へ
// ・React StrictMode の二重実行対策として order.id 単位のロックを実装
// ・途中で注文が matched / in_progress / completed になったら打ち切り

import type { Order, Professional } from '../types';
import { DataService } from './DataService';
import { EmailService } from './EmailService';

// ---- 設定（必要に応じて調整してください） ----
const WAIT_MINUTES = 7; // 各候補に待つ時間（分）
const ADMIN_CONTACT = 'of@thisismerci.com'; // Reply-To に使う連絡先
// -----------------------------------------

// グローバルロック（StrictMode 対策：同一タブ二重起動を防ぐ）
declare global {
  // eslint-disable-next-line no-var
  var __milesMatchingLocks: Map<string, Promise<void>>;
}
if (!globalThis.__milesMatchingLocks) globalThis.__milesMatchingLocks = new Map();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fullAddress(addr: Order['address'] | Professional['address']) {
  if (!addr) return '';
  return `${addr.prefecture || ''}${addr.city || ''}${addr.detail || ''}`.trim();
}

async function getSortedByDistance(originText: string, candidates: Professional[]) {
  const destinations = candidates.map((p) => fullAddress(p.address)).filter(Boolean);
  if (destinations.length === 0) return candidates;

  const res = await fetch('/api/distance-matrix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origins: [originText], destinations }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error('[SequentialMatching] distance-matrix 失敗:', res.status, t);
    // 失敗時は元配列のまま返す（フォールバック）
    return candidates;
  }

  const json = await res.json();
  // Google のレスポンス互換 { rows:[ { elements:[ { status, distance:{value, text}, duration:{...} } ] } ] }
  const elements: any[] = json?.rows?.[0]?.elements || [];
  const withDist = candidates.map((p, i) => ({
    pro: p,
    meters: elements[i]?.distance?.value ?? Number.POSITIVE_INFINITY,
  }));

  withDist.sort((a, b) => a.meters - b.meters);
  return withDist.map((x) => x.pro);
}

function buildInviteHtml(order: Order, pro: Professional, index: number) {
  const addr = order.address;
  const when =
    order.preferredDates?.first
      ? new Date(order.preferredDates.first).toLocaleString('ja-JP')
      : 'スケジュール調整';
  const serviceMap: Record<string, Record<string, string>> = {
    'photo-service': { 'real-estate': '不動産撮影', portrait: 'ポートレート撮影', food: 'フード撮影' },
    'cleaning-service': { '1ldk': '1LDK清掃', '2ldk': '2LDK清掃', '3ldk': '3LDK清掃' },
    'staff-service': { translation: '翻訳', interpretation: '通訳', companion: 'イベントコンパニオン' },
  };
  const service = serviceMap[order.serviceId]?.[order.planId] || 'サービス';

  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
      <p>${pro.name} 様</p>
      <p>下記のご依頼にご対応可能かご確認ください。（${index + 1}人目としてご案内）</p>
      <hr/>
      <p><b>案件ID:</b> ${order.id}</p>
      <p><b>サービス:</b> ${service}</p>
      <p><b>希望日時:</b> ${when}</p>
      <p><b>場所:</b> 〒${addr.postalCode} ${addr.prefecture} ${addr.city} ${addr.detail}</p>
      <p><b>お客様:</b> ${order.customerName} (${order.customerEmail})</p>
      <hr/>
      <p>このメールに <b>返信</b> いただければ担当者に届きます（Reply-To 設定済）。</p>
      <p>※他の候補者にも順次ご案内中のため、回答がない場合は ${WAIT_MINUTES} 分後に次の方へ回ります。</p>
    </div>
  `;
}

export class SequentialMatchingService {
  /**
   * 依頼作成後に呼び出し：近い順にプロへ “順番配信”
   */
  static async startMatching(order: Order) {
    // すでに別スレッドが動いていれば何もしない
    if (globalThis.__milesMatchingLocks.get(order.id)) {
      console.log('[SequentialMatching] 既に実行中のためスキップ:', order.id);
      return;
    }

    const lockPromise = this._run(order).catch((e) => {
      console.error('[SequentialMatching] 実行エラー:', e);
    }).finally(() => {
      globalThis.__milesMatchingLocks.delete(order.id);
    });

    globalThis.__milesMatchingLocks.set(order.id, lockPromise);
    return lockPromise;
  }

  private static async _run(order: Order) {
    console.log('🚀 [SequentialMatching] start:', order.id);

    // 候補者：アクティブ + 住所あり のみ
    const allPros = DataService.loadProfessionals().filter(
      (p) => p.isActive && p.address && fullAddress(p.address)
    );
    if (allPros.length === 0) {
      console.warn('[SequentialMatching] 候補プロがいません。');
      return;
    }

    const origin = fullAddress(order.address);
    const sorted = await getSortedByDistance(origin, allPros);

    // 既にマッチ済みなら終了（他タブ・管理画面からの更新を考慮）
    const isAlreadyFixed = () => {
      const latest = DataService.loadOrders().find((o) => o.id === order.id);
      return !latest || ['matched', 'in_progress', 'completed', 'cancelled'].includes(latest.status);
    };

    for (let i = 0; i < sorted.length; i++) {
      if (isAlreadyFixed()) {
        console.log('⛳ [SequentialMatching] 既に確定/終了のため打ち切り:', order.id);
        return;
      }

      const pro = sorted[i];

      // 通知（Reply-To は運用窓口に）
      const html = buildInviteHtml(order, pro, i);
      await EmailService.sendEmail({
        to: pro.email,
        subject: `【案件案内】${order.customerName}様のご依頼（順番: ${i + 1}）`,
        html,
        replyTo: ADMIN_CONTACT,
      });

      console.log(`📨 [SequentialMatching] 案内送信 → ${pro.name} (${i + 1}/${sorted.length})`);

      // 次の人へ回す前に待つ
      await sleep(WAIT_MINUTES * 60 * 1000);
    }

    console.log('🏁 [SequentialMatching] 全候補への案内が完了:', order.id);
  }
}
