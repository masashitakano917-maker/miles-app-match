interface Address {
  postalCode: string;
  prefecture: string;
  city: string;
  detail: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

export class LocationService {
  // 住所から座標を取得（ジオコーディング）
  static async getCoordinatesFromAddress(address: Address): Promise<Coordinates | null> {
    try {
      const fullAddress = `${address.prefecture}${address.city}${address.detail}`;
      console.log(`🗺️ 住所「${fullAddress}」の座標を取得中...`);
      
      // Google Maps Geocoding APIを使用
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('⚠️ Google Maps API キーが設定されていません');
        return this.getMockCoordinates();
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`
      );
      
      if (!response.ok) {
        console.error('Google Maps API リクエストエラー:', response.status);
        return this.getMockCoordinates();
      }

      const data = await response.json();
      
      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        console.warn('住所が見つかりませんでした:', data.status);
        return this.getMockCoordinates();
      }

      const location = data.results[0].geometry.location;
      const coordinates = {
        lat: location.lat,
        lng: location.lng
      };
      
      console.log(`📍 座標取得完了: ${coordinates.lat}, ${coordinates.lng}`);
      return coordinates;
    } catch (error) {
      console.error('座標取得エラー:', error);
      return this.getMockCoordinates();
    }
  }

  // フォールバック用のモック座標
  private static getMockCoordinates(): Coordinates {
    const mockCoordinates = {
      lat: 35.6762 + (Math.random() - 0.5) * 0.1, // 東京周辺のランダムな座標
      lng: 139.6503 + (Math.random() - 0.5) * 0.1
    };
    console.log(`📍 モック座標を使用: ${mockCoordinates.lat}, ${mockCoordinates.lng}`);
    return mockCoordinates;
  }

  // 2点間の距離を計算（ハーバーサイン公式）
  static calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // 地球の半径（km）
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // 小数点第2位まで
  }

  // 度をラジアンに変換
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // プロフェッショナルを距離順にソート
  static async sortProfessionalsByDistance(
    orderAddress: Address,
    professionals: Array<{ id: string; address?: Address; [key: string]: any }>
  ): Promise<Array<{ professional: any; distance: number }>> {
    const orderCoords = await this.getCoordinatesFromAddress(orderAddress);
    if (!orderCoords) {
      console.warn('注文住所の座標取得に失敗しました');
      return professionals.map(p => ({ professional: p, distance: 999 }));
    }

    const professionalDistances = await Promise.all(
      professionals.map(async (professional) => {
        if (!professional.address) {
          return { professional, distance: 999 }; // 住所不明の場合は最遠扱い
        }

        const profCoords = await this.getCoordinatesFromAddress(professional.address);
        if (!profCoords) {
          return { professional, distance: 999 };
        }

        const distance = this.calculateDistance(orderCoords, profCoords);
        console.log(`📏 ${professional.name || professional.id} までの距離: ${distance}km`);
        
        return { professional, distance };
      })
    );

    // 距離順にソート
    return professionalDistances.sort((a, b) => a.distance - b.distance);
  }

  // 指定半径内のプロフェッショナルを検索
  static async findProfessionalsWithinRadius(
    orderAddress: Address,
    professionals: Array<{ id: string; address?: Address; [key: string]: any }>,
    radiusKm: number = 50
  ): Promise<Array<{ professional: any; distance: number }>> {
    const sortedProfessionals = await this.sortProfessionalsByDistance(orderAddress, professionals);
    
    return sortedProfessionals.filter(({ distance }) => distance <= radiusKm);
  }
}