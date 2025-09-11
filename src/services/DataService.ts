// データ永続化サービス
export class DataService {
  private static readonly STORAGE_KEYS = {
    PROFESSIONALS: 'professionals_data',
    ORDERS: 'orders_data',
    CUSTOMERS: 'customers_data',
    LABELS: 'labels_data'
  };

  // ラベルデータの保存
  static saveLabels(labels: any[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.LABELS, JSON.stringify(labels));
      console.log('✅ ラベルデータを保存しました');
    } catch (error) {
      console.error('❌ ラベルデータ保存エラー:', error);
    }
  }

  // ラベルデータの読み込み
  static loadLabels(): any[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.LABELS);
      if (data) {
        const labels = JSON.parse(data);
        console.log('✅ ラベルデータを読み込みました:', labels.length, '件');
        return labels;
      }
    } catch (error) {
      console.error('❌ ラベルデータ読み込みエラー:', error);
    }
    
    // デフォルトラベルを返す
    return [
      { id: 'label-1', name: '不動産撮影', category: '写真撮影' },
      { id: 'label-2', name: 'ポートレート撮影', category: '写真撮影' },
      { id: 'label-3', name: 'フード撮影', category: '写真撮影' },
      { id: 'label-4', name: '1LDK', category: 'お掃除' },
      { id: 'label-5', name: '2LDK', category: 'お掃除' },
      { id: 'label-6', name: '3LDK', category: 'お掃除' },
      { id: 'label-7', name: '翻訳', category: 'スタッフ派遣' },
      { id: 'label-8', name: '通訳', category: 'スタッフ派遣' },
      { id: 'label-9', name: 'イベントコンパニオン', category: 'スタッフ派遣' }
    ];
  }

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
    
    // 空配列を返す
    return [];
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
      
      // 保存後にイベントを発火（Admin画面更新用）
      window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: orders }));
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

  // カスタマーデータの保存
  static saveCustomers(customers: any[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      console.log('✅ カスタマーデータを保存しました');
    } catch (error) {
      console.error('❌ カスタマーデータ保存エラー:', error);
    }
  }

  // カスタマーデータの読み込み
  static loadCustomers(): any[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.CUSTOMERS);
      if (data) {
        const customers = JSON.parse(data);
        console.log('✅ カスタマーデータを読み込みました:', customers.length, '件');
        return customers;
      }
    } catch (error) {
      console.error('❌ カスタマーデータ読み込みエラー:', error);
    }
    return [];
  }

  // データクリア（開発用）
  static clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEYS.PROFESSIONALS);
    localStorage.removeItem(this.STORAGE_KEYS.ORDERS);
    localStorage.removeItem(this.STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(this.STORAGE_KEYS.LABELS);
    console.log('✅ すべてのデータをクリアしました');
  }
}