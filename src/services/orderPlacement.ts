// src/services/orderPlacement.ts
import type { Order, Plan } from '../types';
import { DataService } from './DataService';
import { NotificationService } from './NotificationService';

export const ORDERS_UPDATED_EVENT = 'ordersUpdated';

export type CreateOrderParams = {
  serviceId: string;
  plan: Plan; // { id, name, price, ... }
  customer: { name: string; email: string; phone: string };
  address: { postalCode: string; prefecture: string; city: string; detail: string };
  preferredDates?: {
    first?: Date | string;
    second?: Date | string;
    third?: Date | string;
  };
};

function toDate(v?: Date | string) {
  if (!v) return undefined;
  return v instanceof Date ? v : new Date(v);
}

/**
 * オーダー作成→保存→通知 の“正しい順番”を1関数にまとめたヘルパー。
 * 通知に失敗してもオーダーは確定させます。
 */
export async function placeOrder(params: CreateOrderParams): Promise<Order> {
  const id = `ord-${Date.now()}`;

  const order: Order = {
    id,
    serviceId: params.serviceId,
    planId: params.plan.id,
    customerName: params.customer.name,
    customerEmail: params.customer.email,
    customerPhone: params.customer.phone,
    address: {
      postalCode: params.address.postalCode,
      prefecture: params.address.prefecture,
      city: params.address.city,
      detail: params.address.detail,
    },
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    preferredDates: params.preferredDates
      ? {
          first: toDate(params.preferredDates.first)!,
          second: toDate(params.preferredDates.second),
          third: toDate(params.preferredDates.third),
        }
      : undefined,
  };

  // 1) まず保存（通知が落ちても履歴は残す）
  const current = DataService.loadOrders();
  const next = [...current, order];
  DataService.saveOrders(next);
  window.dispatchEvent(new CustomEvent(ORDERS_UPDATED_EVENT, { detail: next }));

  // 2) 通知（失敗しても throw しない）
  try {
    await NotificationService.sendOrderNotification(order, params.plan);
  } catch (e) {
    console.error('通知送信に失敗しましたが、オーダーは作成済みです:', e);
  }

  return order;
}
