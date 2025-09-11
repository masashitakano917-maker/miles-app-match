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
        const error = 'Google Maps API キーが設定されていません。環境変数 VITE_GOOGLE_MAPS_API_KEY を確認してください。';
        console.error('❌', error);
        throw new Error(error);
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`
      );
      
      if (!response.ok) {
        const error = `Google Maps API リクエストエラー: ${response.status} ${response.statusText}`;
        console.error('❌', error);
        throw new Error(error);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        const error = `住所が見つかりませんでした: ${data.status}${data.error_message ? ' - ' + data.error_message : ''}`;
        console.error('❌', error);
        throw new Error(error);
      }

      const location = data.results[0].geometry.location;
      const coordinates = {
        lat: location.lat,
        lng: location.lng
      };
      
      console.log(`📍 座標取得完了: ${coordinates.lat}, ${coordinates.lng}`);
      return coordinates;
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ 座標取得エラー:', error.message);
        throw error;
      } else {
        const errorMessage = '座標取得中に予期しないエラーが発生しました';
        console.error('❌', errorMessage, error);
        throw new Error(errorMessage);
      }
    }
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
    try {
      const orderCoords = await this.getCoordinatesFromAddress(orderAddress);
      if (!orderCoords) {
        throw new Error('注文住所の座標取得に失敗しました');
      }

      const professionalDistances = await Promise.all(
        professionals.map(async (professional) => {
          if (!professional.address) {
            console.warn(`⚠️ ${professional.name || professional.id} の住所が設定されていません`);
            return { professional, distance: Infinity }; // 住所不明の場合は無限大
          }

          try {
            const profCoords = await this.getCoordinatesFromAddress(professional.address);
            if (!profCoords) {
              throw new Error('プロフェッショナルの座標取得に失敗');
            }

            const distance = this.calculateDistance(orderCoords, profCoords);
            console.log(`📏 ${professional.name || professional.id} までの距離: ${distance}km`);
            
            return { professional, distance };
          } catch (error) {
            console.error(`❌ ${professional.name || professional.id} の座標取得エラー:`, error);
            return { professional, distance: Infinity };
          }
        })
      );

      // 距離順にソート（無限大は最後に）
      return professionalDistances.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('❌ プロフェッショナルの距離ソートエラー:', error);
      throw error;
    }
  }

  // 指定半径内のプロフェッショナルを検索
  static async findProfessionalsWithinRadius(
    orderAddress: Address,
    professionals: Array<{ id: string; address?: Address; [key: string]: any }>,
    radiusKm: number = 50
  ): Promise<Array<{ professional: any; distance: number }>> {
    try {
      const sortedProfessionals = await this.sortProfessionalsByDistance(orderAddress, professionals);
      
      return sortedProfessionals.filter(({ distance }) => distance <= radiusKm && distance !== Infinity);
    } catch (error) {
      console.error('❌ 半径内プロフェッショナル検索エラー:', error);
      throw error;
    }
  }
}