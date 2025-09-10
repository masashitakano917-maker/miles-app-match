// データ永続化サービス
export class DataService {
  private static readonly STORAGE_KEYS = {
    PROFESSIONALS: 'professionals_data',
    ORDERS: 'orders_data',
    CUSTOMERS: 'customers_data'
  };

  // プロフェッショナルデータの保存
  static saveProfessionals(professionals: any[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.PROFESSIONALS, JSON.stringify(professionals));
      console.log('✅ プロフェッショナルデータを保存しました');
    } catch (error) {
      console.error('❌ プロフェッショナルデータ保存エラー:', error);
    }
  }

  // プロフェッショナルデータの読み込み
  static loadProfessionals(): any[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.PROFESSIONALS);
      if (data) {
        const professionals = JSON.parse(data);
        console.log('✅ プロフェッショナルデータを読み込みました:', professionals.length, '件');
        return professionals;
      }
    } catch (error) {
      console.error('❌ プロフェッショナルデータ読み込みエラー:', error);
    }
    
    // デフォルトデータを返す
    return [
      {
        id: 'pro-1',
        name: '佐藤花子',
        email: 'sato@example.com',
        phone: '090-1234-5678',
        password: 'password123',
        role: 'professional',
        labels: [{ id: 'l1', name: '不動産撮影', category: '写真撮影' }],
        isActive: true,
        completedJobs: 15,
        rating: 4.8,
        address: {
          postalCode: '100-0001',
          prefecture: '東京都',
          city: '千代田区',
          detail: '丸の内1-1-1'
        }
      },
      {
        id: 'pro-2',
        name: '田中一郎',
        email: 'tanaka@example.com',
        phone: '090-9876-5432',
        password: 'password456',
        role: 'professional',
        labels: [{ id: 'l4', name: '1LDK', category: 'お掃除' }],
        isActive: true,
        completedJobs: 23,
        rating: 4.9,
        address: {
          postalCode: '150-0001',
          prefecture: '東京都',
          city: '渋谷区',
          detail: '神宮前2-2-2'
        }
      }
    ];
  }

  // 注文データの保存
  static saveOrders(orders: any[]): void {
    try {
      // Dateオブジェクトを文字列に変換して保存
      const serializedOrders = orders.map(order => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        scheduledDate: order.scheduledDate?.toISOString(),
        preferredDates: order.preferredDates ? {
          first: order.preferredDates.first.toISOString(),
          second: order.preferredDates.second?.toISOString(),
          third: order.preferredDates.third?.toISOString()
        } : undefined
      }));
      
      localStorage.setItem(this.STORAGE_KEYS.ORDERS, JSON.stringify(serializedOrders));
      console.log('✅ 注文データを保存しました');
    } catch (error) {
      console.error('❌ 注文データ保存エラー:', error);
    }
  }

  // 注文データの読み込み
  static loadOrders(): any[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.ORDERS);
      if (data) {
        const orders = JSON.parse(data);
        // 文字列をDateオブジェクトに変換
        const deserializedOrders = orders.map((order: any) => ({
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
        console.log('✅ 注文データを読み込みました:', deserializedOrders.length, '件');
        return deserializedOrders;
      }
    } catch (error) {
      console.error('❌ 注文データ読み込みエラー:', error);
    }
    return [];
  }

  // データクリア（開発用）
  static clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEYS.PROFESSIONALS);
    localStorage.removeItem(this.STORAGE_KEYS.ORDERS);
    localStorage.removeItem(this.STORAGE_KEYS.CUSTOMERS);
    console.log('✅ すべてのデータをクリアしました');
  }
}