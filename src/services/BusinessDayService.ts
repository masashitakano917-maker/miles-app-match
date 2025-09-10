interface Holiday {
  date: string; // YYYY-MM-DD format
  name: string;
}

export class BusinessDayService {
  // 営業日設定（柔軟に変更可能）
  private static businessDays = [1, 2, 3, 4, 5]; // 月曜日=1, 火曜日=2, ..., 日曜日=0
  
  // 祝日リスト（管理者が設定可能）
  private static holidays: Holiday[] = [
    { date: '2025-01-01', name: '元日' },
    { date: '2025-01-13', name: '成人の日' },
    { date: '2025-02-11', name: '建国記念の日' },
    { date: '2025-02-23', name: '天皇誕生日' },
    { date: '2025-03-20', name: '春分の日' },
    { date: '2025-04-29', name: '昭和の日' },
    { date: '2025-05-03', name: '憲法記念日' },
    { date: '2025-05-04', name: 'みどりの日' },
    { date: '2025-05-05', name: 'こどもの日' },
    { date: '2025-07-21', name: '海の日' },
    { date: '2025-08-11', name: '山の日' },
    { date: '2025-09-15', name: '敬老の日' },
    { date: '2025-09-23', name: '秋分の日' },
    { date: '2025-10-13', name: 'スポーツの日' },
    { date: '2025-11-03', name: '文化の日' },
    { date: '2025-11-23', name: '勤労感謝の日' }
  ];

  // 営業日設定を更新（管理者用）
  static updateBusinessDays(days: number[]): void {
    this.businessDays = days;
  }

  // 祝日を追加（管理者用）
  static addHoliday(holiday: Holiday): void {
    this.holidays.push(holiday);
  }

  // 祝日を削除（管理者用）
  static removeHoliday(date: string): void {
    this.holidays = this.holidays.filter(h => h.date !== date);
  }

  // 指定日が営業日かどうかを判定
  static isBusinessDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    const dateString = date.toISOString().split('T')[0];
    
    // 営業日でない曜日をチェック
    if (!this.businessDays.includes(dayOfWeek)) {
      return false;
    }
    
    // 祝日をチェック
    if (this.holidays.some(h => h.date === dateString)) {
      return false;
    }
    
    return true;
  }

  // 営業時間を考慮した時間差を計算（非営業日は除外）
  static calculateBusinessHours(fromDate: Date, toDate: Date): number {
    if (fromDate >= toDate) {
      return 0;
    }

    let totalHours = 0;
    let currentDate = new Date(fromDate);
    
    while (currentDate < toDate) {
      if (this.isBusinessDay(currentDate)) {
        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        
        const endOfPeriod = nextDay > toDate ? toDate : nextDay;
        const hoursInThisDay = (endOfPeriod.getTime() - currentDate.getTime()) / (1000 * 60 * 60);
        
        totalHours += hoursInThisDay;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }
    
    return totalHours;
  }

  // キャンセル料金を計算
  static calculateCancellationFee(orderDate: Date, scheduledDate: Date, orderAmount: number): {
    fee: number;
    feePercentage: number;
    businessHours: number;
    reason: string;
  } {
    const businessHours = this.calculateBusinessHours(orderDate, scheduledDate);
    
    let feePercentage = 0;
    let reason = '';
    
    if (businessHours < 24) {
      feePercentage = 100;
      reason = '予定日時まで24営業時間を切っているため';
    } else if (businessHours < 48) {
      feePercentage = 50;
      reason = '予定日時まで48営業時間を切っているため';
    } else {
      feePercentage = 0;
      reason = '十分な営業時間があるため';
    }
    
    const fee = Math.round(orderAmount * (feePercentage / 100));
    
    return {
      fee,
      feePercentage,
      businessHours,
      reason
    };
  }

  // 営業日リストを取得（管理者用）
  static getBusinessDays(): number[] {
    return [...this.businessDays];
  }

  // 祝日リストを取得（管理者用）
  static getHolidays(): Holiday[] {
    return [...this.holidays];
  }
}