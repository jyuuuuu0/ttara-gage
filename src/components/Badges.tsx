import type { OpenState } from "@/lib/hours";

/** 가게 상태를 포토카드에 붙이는 스티커처럼 */
export function OpenSticker({ state }: { state: OpenState }) {
  const map: Record<OpenState, [string, string]> = {
    open: ["영업 중", "bg-sticker text-ink"],
    closed: ["영업 끝", "bg-line text-ink-soft"],
    holiday: ["오늘 쉬어요", "bg-ink text-white"],
    unknown: ["시간 정보 없음", "bg-line text-ink-soft"],
  };
  const [label, cls] = map[state];
  return <span className={`sticker ${cls}`}>{label}</span>;
}

export function PeakSticker() {
  return <span className="sticker rotate-2 bg-pink text-white">지금 제일 붐벼요</span>;
}

export function Chip({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
        strong ? "bg-cobalt/10 text-cobalt-deep" : "bg-sleeve text-ink-soft"
      }`}
    >
      {children}
    </span>
  );
}
