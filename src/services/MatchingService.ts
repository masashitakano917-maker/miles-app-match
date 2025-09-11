// プロフェッショナルマッチングサービス
import { DataService } from './DataService';
import type { Order, Professional, Label } from '../types';

export class MatchingService {
  // 注文に該当するプロフェッショナルを検索
  static findEligibleProfessionals(order: Order): Professional[] {
    const allProfessionals = DataService.loadProfessionals();
    const allLabels = DataService.loadLabels();
    
    console.log(`🔍 注文 ${order.id} に該当するプロフェッショナルを検索中...`);
    console.log(`📋 サービス: ${order.serviceId}, プラン: ${order.planId}`);
    
    // プランに対応するラベルを検索
    const relevantLabels = this.findRelevantLabels(order.serviceId, order.planId, allLabels);
    console.log(`🏷️ 該当ラベル:`, relevantLabels.map(l => l.name));
    
    // アクティブなプロフェッショナルをフィルタリング
    const activeProfessionals = allProfessionals.filter(pro => pro.isActive);
    console.log(`👥 アクティブプロフェッショナル: ${activeProfessionals.length}名`);
    
    // ラベルマッチングでフィルタリング
    const eligibleProfessionals = activeProfessionals.filter(pro => {
      if (!pro.labels || pro.labels.length === 0) return false;
      
      return relevantLabels.some(relevantLabel => 
        pro.labels.some(proLabel => 
          proLabel.id === relevantLabel.id || 
          proLabel.name === relevantLabel.name ||
          this.isLabelMatch(proLabel, relevantLabel)
        )
      );
    });
    
    console.log(`✅ 該当プロフェッショナル: ${eligibleProfessionals.length}名`);
    eligibleProfessionals.forEach(pro => {
      console.log(`   - ${pro.name} (${pro.labels.map(l => l.name).join(', ')})`);
    });
    
    return eligibleProfessionals;
  }
  
  // サービス・プランに対応するラベルを検索
  private static findRelevantLabels(serviceId: string, planId: string, allLabels: Label[]): Label[] {
    const serviceMapping: { [key: string]: { [key: string]: string[] } } = {
      'photo-service': {
        'real-estate': ['不動産撮影'],
        'portrait': ['ポートレート撮影'],
        'food': ['フード撮影']
      },
      'cleaning-service': {
        '1ldk': ['1LDK'],
        '2ldk': ['2LDK'],
        '3ldk': ['3LDK']
      },
      'staff-service': {
        'translation': ['翻訳'],
        'interpretation': ['通訳'],
        'companion': ['イベントコンパニオン']
      }
    };
    
    const labelNames = serviceMapping[serviceId]?.[planId] || [];
    
    return allLabels.filter(label => 
      labelNames.some(name => 
        label.name.includes(name) || name.includes(label.name)
      )
    );
  }
  
  // ラベルマッチング判定
  private static isLabelMatch(proLabel: Label, relevantLabel: Label): boolean {
    // カテゴリが同じ場合
    if (proLabel.category === relevantLabel.category) return true;
    
    // 名前の部分一致
    if (proLabel.name.includes(relevantLabel.name) || relevantLabel.name.includes(proLabel.name)) {
      return true;
    }
    
    return false;
  }
  
  // 新規依頼をプロフェッショナルに配信
  static distributeNewOrder(order: Order): Professional[] {
    const eligibleProfessionals = this.findEligibleProfessionals(order);
    
    // 各プロフェッショナルの新規依頼リストに追加
    eligibleProfessionals.forEach(professional => {
      this.addOrderToProfessional(professional.id, order);
    });
    
    return eligibleProfessionals;
  }
  
  // プロフェッショナルの新規依頼リストに追加
  private static addOrderToProfessional(professionalId: string, order: Order): void {
    const storageKey = `professional_orders_${professionalId}`;
    const existingOrders = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // 重複チェック
    if (!existingOrders.find((o: Order) => o.id === order.id)) {
      existingOrders.push({
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt),
        scheduledDate: order.scheduledDate ? new Date(order.scheduledDate) : undefined,
        preferredDates: order.preferredDates ? {
          first: new Date(order.preferredDates.first),
          second: order.preferredDates.second ? new Date(order.preferredDates.second) : undefined,
          third: order.preferredDates.third ? new Date(order.preferredDates.third) : undefined
        } : undefined
      });
      
      localStorage.setItem(storageKey, JSON.stringify(existingOrders));
      console.log(`📋 プロフェッショナル ${professionalId} に新規依頼 ${order.id} を配信`);
    }
  }
  
  // プロフェッショナルの新規依頼リストを取得
  static getProfessionalOrders(professionalId: string): Order[] {
    const storageKey = `professional_orders_${professionalId}`;
    const orders = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    return orders.map((order: any) => ({
      ...order,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt),
      scheduledDate: order.scheduledDate ? new Date(order.scheduledDate) : undefined,
      preferredDates: order.preferredDates ? {
        first: new Date(order.preferredDates.first),
        second: order.preferredDates.second ? new Date(order.preferredDates.second) : undefined,
        third: order.preferredDates.third ? new Date(order.preferredDates.third) : undefined
      } : undefined
    }));
  }
  
  // プロフェッショナルの依頼を削除（受注時）
  static removeOrderFromProfessional(professionalId: string, orderId: string): void {
    const storageKey = `professional_orders_${professionalId}`;
    const orders = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updatedOrders = orders.filter((order: Order) => order.id !== orderId);
    
    localStorage.setItem(storageKey, JSON.stringify(updatedOrders));
    console.log(`📋 プロフェッショナル ${professionalId} から依頼 ${orderId} を削除`);
  }
  
  // 全プロフェッショナルから依頼を削除（キャンセル時）
  static removeOrderFromAllProfessionals(orderId: string): void {
    const allProfessionals = DataService.loadProfessionals();
    
    allProfessionals.forEach(professional => {
      this.removeOrderFromProfessional(professional.id, orderId);
    });
    
    console.log(`📋 全プロフェッショナルから依頼 ${orderId} を削除`);
  }
}