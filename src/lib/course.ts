import { distanceM } from "./geo";

export interface CoursePoint { id: string; name: string; district: string; latLng: [number, number] }
export interface Course { district: string; stops: CoursePoint[]; totalM: number }

/** "서울 성동구 성수동2가 ..." → "서울 성동구" */
export function districtOf(addr: string): string {
  const parts = addr.trim().split(/\s+/);
  return parts.slice(0, 2).join(" ");
}

/**
 * 같은 시·군·구에 있는 성지를 묶고, 가장 가까운 곳부터 차례로 잇는(최근접 이웃) 순례 코스를 만든다.
 * 성지가 2곳 이상인 지역만 코스로 만든다.
 */
export function buildCourses(points: CoursePoint[]): Course[] {
  const groups = new Map<string, CoursePoint[]>();
  for (const p of points) groups.set(p.district, [...(groups.get(p.district) ?? []), p]);

  const courses: Course[] = [];
  for (const [district, pts] of groups) {
    if (pts.length < 2) continue;
    const rest = [...pts];
    // 시작점: 서쪽 끝 (일관된 결과를 위해)
    rest.sort((a, b) => a.latLng[1] - b.latLng[1]);
    const ordered = [rest.shift()!];
    let total = 0;
    while (rest.length) {
      const last = ordered[ordered.length - 1];
      let bi = 0, bd = Infinity;
      rest.forEach((p, i) => { const d = distanceM(last.latLng, p.latLng); if (d < bd) { bd = d; bi = i; } });
      total += bd;
      ordered.push(rest.splice(bi, 1)[0]);
    }
    courses.push({ district, stops: ordered, totalM: Math.round(total) });
  }
  return courses.sort((a, b) => b.stops.length - a.stops.length);
}
