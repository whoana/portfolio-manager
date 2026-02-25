"use client";

import { useState } from "react";

export interface BarChartItem {
  label: string;
  targetValue: number;
  actualValue: number;
}

interface BarChartProps {
  data: BarChartItem[];
  targetColor?: string;
  actualColor?: string;
  overColor?: string;
}

export default function BarChart({
  data,
  targetColor = "var(--color-primary)",
  actualColor = "#10B981",
  overColor = "#EF4444",
}: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) return null;

  const maxValue = Math.max(...data.flatMap((d) => [d.targetValue, d.actualValue]), 0.01);
  const barHeight = 18;
  const gap = 8;
  const labelWidth = 100;
  const valueWidth = 70;
  const chartWidth = 500;
  const rowHeight = barHeight * 2 + gap + 16; // 2 bars + gap + padding
  const svgWidth = labelWidth + chartWidth + valueWidth;
  const svgHeight = data.length * rowHeight + 10;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full"
      aria-label="비중 비교 바차트"
      role="img"
    >
      {data.map((item, i) => {
        const y = i * rowHeight + 5;
        const isHovered = hoveredIndex === i;
        const targetBarWidth = (item.targetValue / maxValue) * (chartWidth - 10);
        const actualBarWidth = (item.actualValue / maxValue) * (chartWidth - 10);
        const isOver = item.actualValue > item.targetValue;
        const barOpacity = hoveredIndex === null || isHovered ? 1 : 0.4;

        return (
          <g
            key={item.label}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ cursor: "pointer" }}
          >
            {/* Label */}
            <text
              x={labelWidth - 8}
              y={y + barHeight}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-foreground text-[11px] font-medium"
            >
              {item.label}
            </text>
            {/* Target bar */}
            <rect
              x={labelWidth}
              y={y}
              width={Math.max(targetBarWidth, 2)}
              height={barHeight}
              rx={3}
              fill={targetColor}
              opacity={barOpacity * 0.8}
              className="transition-opacity duration-200"
            />
            <text
              x={labelWidth + Math.max(targetBarWidth, 2) + 6}
              y={y + barHeight / 2}
              dominantBaseline="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {(item.targetValue * 100).toFixed(1)}% 목표
            </text>
            {/* Actual bar */}
            <rect
              x={labelWidth}
              y={y + barHeight + 3}
              width={Math.max(actualBarWidth, 2)}
              height={barHeight}
              rx={3}
              fill={isOver ? overColor : actualColor}
              opacity={barOpacity}
              className="transition-opacity duration-200"
            />
            <text
              x={labelWidth + Math.max(actualBarWidth, 2) + 6}
              y={y + barHeight + 3 + barHeight / 2}
              dominantBaseline="middle"
              className={`text-[10px] ${isOver ? "fill-accent-red" : "fill-accent-green"}`}
            >
              {(item.actualValue * 100).toFixed(1)}% 실제
            </text>
          </g>
        );
      })}
    </svg>
  );
}
