"use client";

// A resizable price chart for OS windows: real closes as a line + area, a
// faint grid, optional horizontal levels. Stretches with its container
// (non-scaling strokes), so window resizes reflow it naturally.
import { useId } from "react";

export interface ChartLevel {
  value: number;
  label: string;
  tone?: "gold" | "up" | "down";
}

export function MiniChart({ closes, levels = [], className = "" }: { closes: readonly number[]; levels?: readonly ChartLevel[]; className?: string }) {
  const id = useId().replace(/:/g, "");
  if (closes.length < 2) return <div className={className} />;
  const vals = [...closes, ...levels.map((l) => l.value)];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pad = (max - min) * 0.12 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const y = (v: number) => 100 - ((v - lo) / (hi - lo)) * 100;
  const x = (i: number) => (i / (closes.length - 1)) * 100;
  const line = closes.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  const up = closes[closes.length - 1] >= closes[0];
  const stroke = up ? "#00E676" : "#FF4D4D";
  const toneColor = (t?: ChartLevel["tone"]) => (t === "up" ? "#00E676" : t === "down" ? "#FF6B6B" : "#E9B44C");

  return (
    <div className={`relative ${className}`}>
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`g${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={stroke} stopOpacity="0.22" />
            <stop offset="1" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[20, 40, 60, 80].map((g) => (
          <line key={g} x1="0" x2="100" y1={g} y2={g} stroke="rgba(255,255,255,0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        <polygon points={`0,100 ${line} 100,100`} fill={`url(#g${id})`} />
        <polyline points={line} fill="none" stroke={stroke} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {levels.map((l) => (
          <line key={l.label} x1="0" x2="100" y1={y(l.value)} y2={y(l.value)} stroke={toneColor(l.tone)} strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {levels.map((l) => (
        <span
          key={l.label}
          className="absolute right-1.5 -translate-y-full font-mono text-[9.5px] tracking-[0.06em]"
          style={{ top: `${y(l.value)}%`, color: toneColor(l.tone) }}
        >
          {l.label}
        </span>
      ))}
      <span className="absolute right-1.5 rounded px-1 py-0.5 font-mono text-[10px] text-[#050607]" style={{ top: `calc(${y(closes[closes.length - 1])}% - 8px)`, background: stroke }}>
        {closes[closes.length - 1].toLocaleString("en-US", { maximumFractionDigits: closes[closes.length - 1] < 10 ? 4 : 2 })}
      </span>
    </div>
  );
}
