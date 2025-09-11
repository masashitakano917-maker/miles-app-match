// 距離計算・ジオコーディングサービス
// ポイント: Google Distance Matrix API（運転距離）を Cloudflare Pages Functions 経由で使い、
// その結果で「近い順」に並べ替えます。失敗時は従来のハーバーサイン（直線距離）にフォールバックします。

export interface Address {
  postalCode: string;
  prefecture: string;
  city: string;
  detail: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

type ProfessionalLike = { id: string; name?: string; address?: Address; [key: string]: any };

export class LocationService {
  /** 住所 → フル文字列 */
  private static fullAddress(a?: Address): string {
    if (!a) return '';
    const parts = [a.prefecture, a.city, a.detail].filter(Boolean);
    return parts.join(' ');
  }

  /** 住所 → 座標（Google Geocoding / 直接ブラウザから。フォールバック用） */
  static async getCoordinatesFromAddress(address: Address): Promise<Coordinates | null> {
    try {
      const fullAddress = this.fullAddress(address);
      console.log(`🗺️ 住所「${fullAddress}」の座標を取得中...`);

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
      const coordinates = { lat: location.lat, lng: location.lng };
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

  /** 直線距離（ハーバーサイン） */
  static calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // km
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
      Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 100) / 100; // 小数点2桁
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /** Cloudflare Functions 経由で運転距離をまとめて取得 */
  private static async getDrivingDistancesBatch(
    origin: Address,
    destinations: Address[]
  ): Promise<(number | null)[]> {
    try {
      const res = await fetch('/api/distance-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destinations, mode: 'driving' })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`distance-matrix API error: ${res.status} ${t}`);
      }
      const json = await res.json();
      const arr = (json?.distancesKm ?? []) as (number | null)[];
      if (!Array.isArray(arr)) throw new Error('distance-matrix invalid payload');
      return arr;
    } catch (e) {
      console.error('❌ driving distance 取得失敗:', e);
      throw e;
    }
  }

  /** プロフェッショナルを距離順にソート（運転距離 → フォールバック直線距離） */
  static async sortProfessionalsByDistance(
    orderAddress: Address,
    professionals: ProfessionalLike[]
  ): Promise<Array<{ professional: ProfessionalLike; distance: number }>> {
    // 住所のある人だけ対象
    const withAddr = professionals.filter(p => p.address && (p.address.prefecture || p.address.city));
    if (withAddr.length === 0) return [];

    // まずはサーバーで運転距離を一括取得
    try {
      const distances = await this.getDrivingDistancesBatch(
        orderAddress,
        withAddr.map(p => p.address as Address)
      );

      const list = withAddr.map((p, i) => ({
        professional: p,
        distance: (distances[i] ?? null) == null ? Infinity : (distances[i] as number)
      }));

      // 距離順（Infinity は最後）
      return list.sort((a, b) => (a.distance - b.distance));
    } catch {
      // サーバー距離がダメでも、直線距離でフォールバック
      console.warn('⚠️ 距離APIに失敗したため、直線距離でソートします');
      try {
        const orderCoords = await this.getCoordinatesFromAddress(orderAddress);
        if (!orderCoords) throw new Error('注文住所の座標取得に失敗');

        const list = await Promise.all(
          withAddr.map(async (p) => {
            try {
              const c = await this.getCoordinatesFromAddress(p.address as Address);
              const d = c ? this.calculateDistance(orderCoords, c) : Infinity;
              return { professional: p, distance: d };
            } catch {
              return { professional: p, distance: Infinity };
            }
          })
        );
        return list.sort((a, b) => (a.distance - b.distance));
      } catch (e) {
        console.error('❌ プロフェッショナルの距離ソートエラー:', e);
        // どうしても無理なら、住所持ちを距離∞で返す
        return withAddr.map(p => ({ professional: p, distance: Infinity }));
      }
    }
  }

  /** 半径内プロを抽出（デフォルト50km） */
  static async findProfessionalsWithinRadius(
    orderAddress: Address,
    professionals: ProfessionalLike[],
    radiusKm: number = 50
  ): Promise<Array<{ professional: ProfessionalLike; distance: number }>> {
    const sorted = await this.sortProfessionalsByDistance(orderAddress, professionals);
    return sorted.filter(({ distance }) => distance <= radiusKm && distance !== Infinity);
  }
}
