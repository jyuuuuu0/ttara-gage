import proj4 from "proj4";

const TM128 =
  "+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43";

/** 잇플 응답의 TM128 좌표(xaxsVal, yaxsVal) → WGS84 [lat, lng] */
export function tm128ToLatLng(x: string | number, y: string | number): [number, number] | null {
  const nx = Number(x), ny = Number(y);
  if (!Number.isFinite(nx) || !Number.isFinite(ny) || nx === 0 || ny === 0) return null;
  const [lng, lat] = proj4(TM128, "WGS84", [nx, ny]);
  return [lat, lng];
}

/** 두 지점 사이 거리(m) */
export function distanceM(a: [number, number], b: [number, number]): number {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]), dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
