"use client";

import { useState } from "react";

export interface PieChartDataItem {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartDataItem[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}

export default function PieChart({
  data,
  size = 200,
  centerLabel,
  centerValue,
}: PieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0 || data.length === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;
  const strokeWidth = size * 0.18;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;
  const segments = data.map((item, i) => {
    const ratio = item.value / total;
    const dashLength = ratio * circumference;
    const offset = -accumulated * circumference + circumference * 0.25;
    accumulated += ratio;
    return { ...item, ratio, dashLength, offset, index: i };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`원형차트: ${data.map((d) => `${d.label} ${((d.value / total) * 100).toFixed(1)}%`).join(", ")}`}
      role="img"
    >
      {/* Background circle */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-card-border opacity-30"
      />
      {/* Segments */}
      {segments.map((seg) => (
        <circle
          key={seg.label}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
          strokeDashoffset={seg.offset}
          opacity={hoveredIndex === null || hoveredIndex === seg.index ? 1 : 0.4}
          className="transition-opacity duration-200"
          onMouseEnter={() => setHoveredIndex(seg.index)}
          onMouseLeave={() => setHoveredIndex(null)}
          style={{ cursor: "pointer" }}
        />
      ))}
      {/* Center text */}
      {centerLabel && (
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted text-[10px]"
        >
          {centerLabel}
        </text>
      )}
      {centerValue && (
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-sm font-bold"
        >
          {centerValue}
        </text>
      )}
    </svg>
  );
}
