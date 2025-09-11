// 分析・統計サービス
import type { Order } from '../types';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AnalyticsFilter {
  dateRange?: DateRange;
  serviceId?: string;
  planId?: string;
  dayOfWeek?: number[]; // 0=日曜日, 1=月曜日, ...
  status?: string;
}

export interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  ordersByService: { [key: string]: number };
  ordersByDay: { [key: string]: number };
  ordersByStatus: { [key: string]: number };
  revenueByService: { [key: string]: number };
  dailyStats: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

export interface ComparisonData {
  current: AnalyticsData;
  previous: AnalyticsData;
  growth: {
    orders: number;
    revenue: number;
    completedOrders: number;
  };
}

export class AnalyticsService {
  // 基本統計データを取得
  static getAnalytics(orders: Order[], filter?: AnalyticsFilter): AnalyticsData {
    const filteredOrders = this.filterOrders(orders, filter);
    
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
    const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled').length;
    
    const totalRevenue = filteredOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, order) => sum + this.getPlanPrice(order.planId), 0);
    
    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
    
    // サービス別統計
    const ordersByService: { [key: string]: number } = {};
    const revenueByService: { [key: string]: number } = {};
    
    filteredOrders.forEach(order => {
      const serviceName = this.getServiceName(order.serviceId, order.planId);
      ordersByService[serviceName] = (ordersByService[serviceName] || 0) + 1;
      
      if (order.status === 'completed') {
        revenueByService[serviceName] = (revenueByService[serviceName] || 0) + this.getPlanPrice(order.planId);
      }
    });
    
    // 曜日別統計
    const ordersByDay: { [key: string]: number } = {
      '日': 0, '月': 0, '火': 0, '水': 0, '木': 0, '金': 0, '土': 0
    };
    
    filteredOrders.forEach(order => {
      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
      const dayName = dayNames[order.createdAt.getDay()];
      ordersByDay[dayName]++;
    });
    
    // ステータス別統計
    const ordersByStatus: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
      const statusName = this.getStatusLabel(order.status);
      ordersByStatus[statusName] = (ordersByStatus[statusName] || 0) + 1;
    });
    
    // 日別統計
    const dailyStats = this.getDailyStats(filteredOrders, filter?.dateRange);
    
    return {
      totalOrders,
      totalRevenue,
      completedOrders,
      cancelledOrders,
      averageOrderValue,
      ordersByService,
      ordersByDay,
      ordersByStatus,
      revenueByService,
      dailyStats
    };
  }
  
  // 期間比較データを取得
  static getComparisonData(orders: Order[], currentRange: DateRange, previousRange: DateRange, filter?: Omit<AnalyticsFilter, 'dateRange'>): ComparisonData {
    const currentFilter = { ...filter, dateRange: currentRange };
    const previousFilter = { ...filter, dateRange: previousRange };
    
    const current = this.getAnalytics(orders, currentFilter);
    const previous = this.getAnalytics(orders, previousFilter);
    
    const growth = {
      orders: previous.totalOrders > 0 ? ((current.totalOrders - previous.totalOrders) / previous.totalOrders) * 100 : 0,
      revenue: previous.totalRevenue > 0 ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100 : 0,
      completedOrders: previous.completedOrders > 0 ? ((current.completedOrders - previous.completedOrders) / previous.completedOrders) * 100 : 0
    };
    
    return { current, previous, growth };
  }
  
  // 週単位データを取得
  static getWeeklyData(orders: Order[], weeksBack: number = 4): Array<{ week: string; data: AnalyticsData }> {
    const weeks = [];
    const now = new Date();
    
    for (let i = 0; i < weeksBack; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() + 7 * i));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
      const data = this.getAnalytics(orders, { dateRange: { start: weekStart, end: weekEnd } });
      
      weeks.unshift({ week: weekLabel, data });
    }
    
    return weeks;
  }
  
  // 月単位データを取得
  static getMonthlyData(orders: Order[], monthsBack: number = 6): Array<{ month: string; data: AnalyticsData }> {
    const months = [];
    const now = new Date();
    
    for (let i = 0; i < monthsBack; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      
      const monthLabel = `${monthStart.getFullYear()}年${monthStart.getMonth() + 1}月`;
      const data = this.getAnalytics(orders, { dateRange: { start: monthStart, end: monthEnd } });
      
      months.unshift({ month: monthLabel, data });
    }
    
    return months;
  }
  
  // 注文をフィルタリング
  private static filterOrders(orders: Order[], filter?: AnalyticsFilter): Order[] {
    if (!filter) return orders;
    
    return orders.filter(order => {
      // 日付範囲フィルター
      if (filter.dateRange) {
        const orderDate = order.createdAt;
        if (orderDate < filter.dateRange.start || orderDate > filter.dateRange.end) {
          return false;
        }
      }
      
      // サービスフィルター
      if (filter.serviceId && order.serviceId !== filter.serviceId) {
        return false;
      }
      
      // プランフィルター
      if (filter.planId && order.planId !== filter.planId) {
        return false;
      }
      
      // 曜日フィルター
      if (filter.dayOfWeek && filter.dayOfWeek.length > 0) {
        const orderDayOfWeek = order.createdAt.getDay();
        if (!filter.dayOfWeek.includes(orderDayOfWeek)) {
          return false;
        }
      }
      
      // ステータスフィルター
      if (filter.status && order.status !== filter.status) {
        return false;
      }
      
      return true;
    });
  }
  
  // 日別統計を取得
  private static getDailyStats(orders: Order[], dateRange?: DateRange): Array<{ date: string; orders: number; revenue: number }> {
    const stats: { [key: string]: { orders: number; revenue: number } } = {};
    
    orders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (!stats[dateKey]) {
        stats[dateKey] = { orders: 0, revenue: 0 };
      }
      
      stats[dateKey].orders++;
      if (order.status === 'completed') {
        stats[dateKey].revenue += this.getPlanPrice(order.planId);
      }
    });
    
    return Object.entries(stats)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  
  // プラン価格を取得
  private static getPlanPrice(planId: string): number {
    const prices: { [key: string]: number } = {
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
    return prices[planId] || 0;
  }
  
  // サービス名を取得
  private static getServiceName(serviceId: string, planId: string): string {
    const serviceNames: { [key: string]: { [key: string]: string } } = {
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
    return serviceNames[serviceId]?.[planId] || 'サービス';
  }
  
  // ステータスラベルを取得
  private static getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      pending: '受付中',
      matched: 'マッチ済',
      in_progress: '作業中',
      completed: '完了',
      cancelled: 'キャンセル'
    };
    return statusLabels[status] || status;
  }
  
  // 日付範囲のプリセットを取得
  static getDateRangePresets(): { [key: string]: DateRange } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return {
      today: {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      },
      yesterday: {
        start: new Date(today.getTime() - 24 * 60 * 60 * 1000),
        end: new Date(today.getTime() - 1)
      },
      thisWeek: {
        start: new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000),
        end: new Date(today.getTime() + (6 - today.getDay()) * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000 - 1)
      },
      lastWeek: {
        start: new Date(today.getTime() - (today.getDay() + 7) * 24 * 60 * 60 * 1000),
        end: new Date(today.getTime() - (today.getDay() + 1) * 24 * 60 * 60 * 1000 - 1)
      },
      thisMonth: {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      },
      lastMonth: {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      }
    };
  }
}