/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

/** 등록된 프로필 사진. 주소가 없거나 불러오지 못하면 아무것도 그리지 않는다. */
export default function IdolPhoto({ src, alt, className = "" }: { src?: string; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return null;
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      referrerPolicy="no-referrer"
      className={`object-cover ${className}`}
    />
  );
}
