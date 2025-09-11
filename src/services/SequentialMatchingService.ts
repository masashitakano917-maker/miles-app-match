// 段階的マッチングサービス
import { DataService } from './DataService';
import { LocationService } from './LocationService';
import { NotificationService } from './NotificationService';
import type { Order, Professional } from '../types';

interface MatchingSession {
  orderId: string;
  eligibleProfessionals: Array<{ professional: Professional; distance: number }>;
  currentIndex: number;
  notifiedProfessionals: Set<string>;
  isActive: boolean;
  timerId?: NodeJS.Timeout;
  createdAt: Date;
}

export class SequentialMatchingService {
  private static sessions = new Map<string, MatchingSession>();
  private static readonly WAIT_TIME_MINUTES = 7;
  private static readonly MAX_DISTANCE_KM = 80;

  // 段階的マッチングを開始
  static async startSequentialMatching(order: Order): Promise<void> {
    console.log(`🎯 段階的マッチング開始: ${order.id}`);

    try {
      // 既存セッションがあれば停止
      if (this.sessions.has(order.id)) {
        this.stopMatching(order.id);
      }

      // 該当プロフェッショナルを距離順で取得
      const allProfessionals = DataService.loadProfessionals();
      const eligibleProfessionals = await this.findEligibleProfessionalsByDistance(order, allProfessionals);

      if (eligibleProfessionals.length === 0) {
        console.log('❌ 該当するプロフェッショナルが見つかりません');
        return;
      }

      // マッチングセッション作成
      const session: MatchingSession = {
        orderId: order.id,
        eligibleProfessionals,
        currentIndex: 0,
        notifiedProfessionals: new Set(),
        isActive: true,
        createdAt: new Date()
      };

      this.sessions.set(order.id, session);
      console.log(`📋 ${eligibleProfessionals.length}名のプロフェッショナルが対象`);

      // 最初のプロに通知
      await this.notifyNextProfessional(session);

    } catch (error) {
      console.error('❌ 段階的マッチング開始エラー:', error);
    }
  }

  // 次のプロフェッショナルに通知
  private static async notifyNextProfessional(session: MatchingSession): Promise<void> {
    if (!session.isActive || session.currentIndex >= session.eligibleProfessionals.length) {
      console.log('⏹️ マッチング終了: 全プロフェッショナルに通知済み');
      this.stopMatching(session.orderId);
      return;
    }

    const { professional, distance } = session.eligibleProfessionals[session.currentIndex];
    session.notifiedProfessionals.add(professional.id);

    console.log(`📧 通知送信: ${professional.name} (距離: ${distance}km)`);

    // プロフェッショナルの新規依頼リストに追加（応募可能状態にする）
    this.addOrderToProfessional(professional.id, session.orderId);

    // メール通知送信
    const order = this.getOrderById(session.orderId);
    if (order) {
      await NotificationService.sendProfessionalJobNotification(order, this.getPlanFromOrder(order), professional);
    }

    // 次のインデックスに進める
    session.currentIndex++;

    // 7分後に次のプロに通知するタイマー設定
    session.timerId = setTimeout(async () => {
      if (session.isActive) {
        console.log(`⏰ ${this.WAIT_TIME_MINUTES}分経過 - 次のプロに通知`);
        await this.notifyNextProfessional(session);
      }
    }, this.WAIT_TIME_MINUTES * 60 * 1000);
  }

  // プロフェッショナルが応募
  static async acceptJob(orderId: string, professionalId: string, selectedDate: Date): Promise<boolean> {
    const session = this.sessions.get(orderId);
    if (!session || !session.isActive) {
      console.log('❌ 無効なセッションまたは既に終了済み');
      return false;
    }

    // 通知済みプロフェッショナルかチェック
    if (!session.notifiedProfessionals.has(professionalId)) {
      console.log('❌ 通知されていないプロフェッショナルからの応募');
      return false;
    }

    console.log(`✅ マッチング成功: ${professionalId} が応募`);

    // マッチング完了処理
    await this.completeMatching(orderId, professionalId, selectedDate);
    return true;
  }

  // マッチング完了処理
  private static async completeMatching(orderId: string, professionalId: string, selectedDate: Date): Promise<void> {
    const session = this.sessions.get(orderId);
    if (!session) return;

    // セッション停止
    this.stopMatching(orderId);

    // 注文ステータス更新
    const orders = DataService.loadOrders();
    const updatedOrders = orders.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            status: 'matched' as const,
            assignedProfessionalId: professionalId,
            scheduledDate: selectedDate,
            updatedAt: new Date()
          }
        : order
    );
    DataService.saveOrders(updatedOrders);

    // 全プロフェッショナルから該当注文を削除（リンク無効化）
    session.notifiedProfessionals.forEach(proId => {
      this.removeOrderFromProfessional(proId, orderId);
    });

    // マッチング通知送信
    const order = updatedOrders.find(o => o.id === orderId);
    const professional = DataService.loadProfessionals().find(p => p.id === professionalId);
    
    if (order && professional) {
      await NotificationService.sendMatchNotification(order, professional);
    }

    console.log(`🎉 マッチング完了: ${orderId} → ${professionalId}`);
  }

  // マッチング停止
  static stopMatching(orderId: string): void {
    const session = this.sessions.get(orderId);
    if (session) {
      session.isActive = false;
      if (session.timerId) {
        clearTimeout(session.timerId);
      }
      this.sessions.delete(orderId);
      console.log(`⏹️ マッチングセッション停止: ${orderId}`);
    }
  }

  // 距離順で該当プロフェッショナルを取得
  private static async findEligibleProfessionalsByDistance(
    order: Order, 
    allProfessionals: Professional[]
  ): Promise<Array<{ professional: Professional; distance: number }>> {
    // ラベルでフィルタリング
    const eligibleBySkill = this.filterByLabels(order, allProfessionals);
    
    if (eligibleBySkill.length === 0) {
      return [];
    }

    // 距離でソートし、80km以内に制限
    const sortedByDistance = await LocationService.findProfessionalsWithinRadius(
      order.address,
      eligibleBySkill,
      this.MAX_DISTANCE_KM
    );

    return sortedByDistance;
  }

  // ラベルでフィルタリング
  private static filterByLabels(order: Order, professionals: Professional[]): Professional[] {
    const allLabels = DataService.loadLabels();
    const relevantLabels = this.findRelevantLabels(order.serviceId, order.planId, allLabels);
    
    return professionals.filter(pro => {
      if (!pro.isActive || !pro.labels || pro.labels.length === 0) return false;
      
      return relevantLabels.some(relevantLabel => 
        pro.labels.some(proLabel => 
          proLabel.id === relevantLabel.id || 
          proLabel.name === relevantLabel.name ||
          this.isLabelMatch(proLabel, relevantLabel)
        )
      );
    });
  }

  // サービス・プランに対応するラベルを検索
  private static findRelevantLabels(serviceId: string, planId: string, allLabels: any[]): any[] {
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
  private static isLabelMatch(proLabel: any, relevantLabel: any): boolean {
    if (proLabel.category === relevantLabel.category) return true;
    if (proLabel.name.includes(relevantLabel.name) || relevantLabel.name.includes(proLabel.name)) {
      return true;
    }
    return false;
  }

  // プロフェッショナルの新規依頼リストに追加
  private static addOrderToProfessional(professionalId: string, orderId: string): void {
    const storageKey = `professional_orders_${professionalId}`;
    const existingOrders = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // 重複チェック
    if (!existingOrders.find((o: any) => o.id === orderId)) {
      const order = this.getOrderById(orderId);
      if (order) {
        existingOrders.push({
          ...order,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          scheduledDate: order.scheduledDate?.toISOString(),
          preferredDates: order.preferredDates ? {
            first: order.preferredDates.first.toISOString(),
            second: order.preferredDates.second?.toISOString(),
            third: order.preferredDates.third?.toISOString()
          } : undefined
        });
        
        localStorage.setItem(storageKey, JSON.stringify(existingOrders));
        console.log(`📋 プロフェッショナル ${professionalId} に新規依頼 ${orderId} を配信`);
      }
    }
  }

  // プロフェッショナルの依頼を削除
  private static removeOrderFromProfessional(professionalId: string, orderId: string): void {
    const storageKey = `professional_orders_${professionalId}`;
    const orders = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updatedOrders = orders.filter((order: any) => order.id !== orderId);
    
    localStorage.setItem(storageKey, JSON.stringify(updatedOrders));
    console.log(`📋 プロフェッショナル ${professionalId} から依頼 ${orderId} を削除`);
  }

  // 注文取得
  private static getOrderById(orderId: string): any {
    const orders = DataService.loadOrders();
    return orders.find(order => order.id === orderId);
  }

  // プラン情報取得
  private static getPlanFromOrder(order: any): any {
    const planPrices: { [key: string]: number } = {
      'real-estate': 15000,
      'portrait': 12000,
      'food': 18000,
      '1ldk': 8000,
      '2ldk': 12000,
      '3ldk': 16000,
      'translation': 5000,
      'interpretation': 8000,
      'companion': 15000
    };

    const planNames: { [key: string]: { [key: string]: string } } = {
      'photo-service': {
        'real-estate': '不動産撮影',
        'portrait': 'ポートレート撮影',
        'food': 'フード撮影'
      },
      'cleaning-service': {
        '1ldk': '1LDK清掃',
        '2ldk': '2LDK清掃',
        '3ldk': '3LDK清掃'
      },
      'staff-service': {
        'translation': '翻訳',
        'interpretation': '通訳',
        'companion': 'イベントコンパニオン'
      }
    };

    return {
      id: order.planId,
      name: planNames[order.serviceId]?.[order.planId] || 'サービス',
      price: planPrices[order.planId] || 0,
      description: '',
      serviceId: order.serviceId
    };
  }

  // アクティブセッション一覧取得（管理者用）
  static getActiveSessions(): Array<{
    orderId: string;
    currentIndex: number;
    totalProfessionals: number;
    notifiedCount: number;
    createdAt: Date;
  }> {
    return Array.from(this.sessions.values()).map(session => ({
      orderId: session.orderId,
      currentIndex: session.currentIndex,
      totalProfessionals: session.eligibleProfessionals.length,
      notifiedCount: session.notifiedProfessionals.size,
      createdAt: session.createdAt
    }));
  }

  // セッション詳細取得（管理者用）
  static getSessionDetails(orderId: string): MatchingSession | undefined {
    return this.sessions.get(orderId);
  }
}