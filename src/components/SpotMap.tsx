"use client";

import "leaflet/dist/leaflet.css";
import L, { type LatLngBoundsExpression } from "leaflet";
import { useCallback, useEffect, useMemo } from "react";
import { AttributionControl, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";

export interface MapPoint { id: string; latLng: [number, number]; label: string; sub?: string; order?: number; dim?: boolean }

const HEART =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="#fff"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.2 5.2 3 1.6-1.8 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg>';

function pinIcon(p: MapPoint, active: boolean) {
  const inner = p.order !== undefined ? `<b>${p.order}</b>` : HEART;
  return L.divIcon({
    className: "",
    iconSize: [36, 44],
    iconAnchor: [18, 42],
    html: `<div class="tg-pin ${active ? "is-active" : ""} ${p.dim ? "is-dim" : ""}"><span>${inner}</span></div>`,
  });
}

function bounds(points: MapPoint[]) {
  return points.map((p) => p.latLng) as LatLngBoundsExpression;
}

function FitBounds({ points, selectedId }: { points: MapPoint[]; selectedId?: string | null }) {
  const map = useMap();
  useEffect(() => {
    const sel = points.find((p) => p.id === selectedId);
    if (sel) {
      map.flyTo(sel.latLng, Math.max(map.getZoom(), 16), { duration: 0.6 });
      return;
    }
    if (points.length === 1) map.setView(points[0].latLng, 15);
    else if (points.length > 1) map.fitBounds(bounds(points), { padding: [48, 48] });
  }, [map, points, selectedId]);
  // 컨테이너 크기가 바뀌면(반응형 레이아웃 전환) 타일 다시 계산
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

function Controls({ points }: { points: MapPoint[] }) {
  const map = useMap();
  const stop = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    L.DomEvent.disableClickPropagation(e.currentTarget as HTMLElement);
  }, []);
  const btn =
    "flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-paper text-ink shadow-[2px_2px_0_var(--color-ink)] transition hover:bg-sticker active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

  return (
    <div className="pointer-events-none absolute inset-0 z-[500]" onDoubleClick={(e) => e.stopPropagation()}>
      <div className="pointer-events-auto absolute right-3 top-3 flex flex-col gap-2">
        <button aria-label="확대" className={btn} onClick={(e) => { stop(e); map.zoomIn(); }}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 6v12M6 12h12" /></svg>
        </button>
        <button aria-label="축소" className={btn} onClick={(e) => { stop(e); map.zoomOut(); }}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 12h12" /></svg>
        </button>
      </div>
      {points.length > 1 && (
        <button
          onClick={(e) => { stop(e); map.flyToBounds(bounds(points), { padding: [48, 48], duration: 0.6 }); }}
          className="pointer-events-auto absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-4 py-2 text-sm font-bold text-ink shadow-[2px_2px_0_var(--color-ink)] transition hover:bg-sticker"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
          {points.length}곳 모두 보기
        </button>
      )}
    </div>
  );
}

export default function SpotMap({
  points, selectedId, onSelect, path, height, className = "h-[320px]",
}: {
  points: MapPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  path?: boolean;
  height?: number | string;
  className?: string;
}) {
  const stable = useMemo(() => points, [JSON.stringify(points)]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`relative overflow-hidden rounded-[22px] border-2 border-ink ${className}`} style={height !== undefined ? { height } : undefined}>
      <MapContainer
        center={[37.5665, 126.978]}
        zoom={12}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          className="tg-tiles"
        />
        <AttributionControl position="bottomright" prefix={false} />
        <FitBounds points={stable} selectedId={selectedId} />
        <Controls points={stable} />
        {path && stable.length > 1 && (
          <Polyline
            positions={stable.map((p) => p.latLng)}
            pathOptions={{ color: "#ff5fa2", weight: 4, opacity: 0.9, dashArray: "1 10", lineCap: "round" }}
          />
        )}
        {stable.map((p) => {
          const active = p.id === selectedId;
          return (
            <Marker
              key={p.id + (active ? "-a" : "")}
              position={p.latLng}
              icon={pinIcon(p, active)}
              zIndexOffset={active ? 1000 : 0}
              eventHandlers={{ click: () => onSelect?.(p.id) }}
            >
              <Tooltip direction="top" offset={[0, -40]} className="tg-tip" permanent={active}>
                <b>{p.label}</b>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
