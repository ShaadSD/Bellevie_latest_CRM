'use client';

import React, { useState } from 'react';
import { StatusSegment } from '@/data/dashboardData';

interface DonutChartProps {
  title: string;
  total: number;
  segments: StatusSegment[];
}

export const DonutChart: React.FC<DonutChartProps> = ({ title, total, segments }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG parameters
  const size = 180;
  const center = size / 2;
  const radius = 65;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;

  // Calculate cumulative percentages for donut strokeDasharray & strokeDashoffset
  let cumulativePercent = 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 xl:p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full relative overflow-hidden group donut-card-container">
      {/* Title */}
      <div className="flex items-center justify-between mb-2.5 sm:mb-3">
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
          {title}
        </h3>
        <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
          Total: {total}
        </span>
      </div>

      <div className="donut-card-inner flex-1 w-full">
        {/* SVG Donut */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 xl:w-28 xl:h-28 2xl:w-36 2xl:h-36 shrink-0 flex items-center justify-center my-0.5">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90">
            {/* Background ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
            />

            {/* Segment arcs */}
            {segments.map((seg, i) => {
              const segmentPercent = total > 0 ? seg.count / total : 0;
              const strokeDasharray = `${segmentPercent * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativePercent * circumference;
              cumulativePercent += segmentPercent;

              const isHovered = hoveredIndex === i;

              return (
                <circle
                  key={seg.label}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>

          {/* Donut Center Label */}
          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none px-2">
            <span className="text-lg sm:text-xl 2xl:text-2xl font-black text-slate-900 leading-tight">
              {hoveredIndex !== null ? segments[hoveredIndex].count : total}
            </span>
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 truncate max-w-[80px]">
              {hoveredIndex !== null ? segments[hoveredIndex].label : 'Total'}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="donut-legend-list w-full space-y-1 sm:space-y-1.5 flex-1 min-w-0">
          {segments.map((seg, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <div
                key={seg.label}
                className={`flex items-center justify-between text-[11px] xl:text-xs transition-all duration-150 px-1.5 py-0.5 sm:py-1 rounded-md cursor-pointer ${
                  isHovered ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'
                }`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-slate-600 font-medium truncate text-[11px]">
                    {seg.label}
                  </span>
                </div>
                <div className="text-right shrink-0 text-slate-900 font-bold whitespace-nowrap text-[11px]">
                  <span>{seg.count}</span>{' '}
                  <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                    ({seg.percentage})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
