'use client';

import React, { useState } from 'react';
import { ChartDataPoint } from '@/data/dashboardData';

interface ServiceTrendChartProps {
  data: ChartDataPoint[];
  maxScale: number;
  scaleSteps: number[];
}

export const ServiceTrendChart: React.FC<ServiceTrendChartProps> = ({
  data,
  maxScale,
  scaleSteps
}) => {
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  // Chart dimensions
  const width = 560;
  const height = 220;
  const paddingLeft = 36;
  const paddingRight = 36;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates for points
  const getX = (index: number) => {
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (value: number) => {
    return paddingTop + chartHeight - (value / maxScale) * chartHeight;
  };

  // Generate SVG path for a line
  const makePath = (key: 'ambulance' | 'homecare' | 'hospital') => {
    return data.reduce((acc, point, i) => {
      const x = getX(i);
      const y = getY(point[key]);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 xl:p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full relative overflow-hidden group">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Service Requests Trend
        </h3>
        <span className="text-xs font-medium text-slate-400">
          Last 6 Months
        </span>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden flex-1 min-h-[220px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
        >
          {/* Horizontal Grid lines and Y-axis labels */}
          {scaleSteps.map((step) => {
            const y = getY(step);
            return (
              <g key={step}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  fill="#94A3B8"
                  fontSize="11"
                  textAnchor="end"
                  fontWeight="500"
                >
                  {step}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {data.map((point, i) => {
            const x = getX(i);
            return (
              <text
                key={point.month}
                x={x}
                y={height - 10}
                fill="#64748B"
                fontSize="11"
                textAnchor="middle"
                fontWeight="500"
              >
                {point.month}
              </text>
            );
          })}

          {/* Vertical Guide Line on Hover */}
          {activePointIndex !== null && (
            <line
              x1={getX(activePointIndex)}
              y1={paddingTop}
              x2={getX(activePointIndex)}
              y2={paddingTop + chartHeight}
              stroke="#CBD5E1"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
          )}

          {/* Lines */}
          <path
            d={makePath('ambulance')}
            fill="none"
            stroke="#EF4444"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={makePath('homecare')}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={makePath('hospital')}
            fill="none"
            stroke="#9333EA"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points / Circles */}
          {data.map((point, i) => {
            const x = getX(i);
            const yAmb = getY(point.ambulance);
            const yHome = getY(point.homecare);
            const yHosp = getY(point.hospital);
            const isHovered = activePointIndex === i;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setActivePointIndex(i)}
                onMouseLeave={() => setActivePointIndex(null)}
              >
                {/* Invisible hover target column */}
                <rect
                  x={x - 20}
                  y={paddingTop}
                  width="40"
                  height={chartHeight}
                  fill="transparent"
                />

                {/* Ambulance Dot */}
                <circle
                  cx={x}
                  cy={yAmb}
                  r={isHovered ? 6 : 4}
                  fill="#EF4444"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />

                {/* Homecare Dot */}
                <circle
                  cx={x}
                  cy={yHome}
                  r={isHovered ? 6 : 4}
                  fill="#F59E0B"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />

                {/* Hospital Dot */}
                <circle
                  cx={x}
                  cy={yHosp}
                  r={isHovered ? 6 : 4}
                  fill="#9333EA"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activePointIndex !== null && (
          <div
            className="absolute bg-slate-900 text-white rounded-lg p-2.5 shadow-xl text-xs z-20 pointer-events-none transition-all duration-150 transform -translate-x-1/2"
            style={{
              left: `${(getX(activePointIndex) / width) * 100}%`,
              top: '20px'
            }}
          >
            <div className="font-bold text-slate-300 border-b border-slate-700 pb-1 mb-1">
              {data[activePointIndex].month}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-slate-400">Ambulance:</span>
                <span className="font-bold">{data[activePointIndex].ambulance}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-slate-400">Homecare:</span>
                <span className="font-bold">{data[activePointIndex].homecare}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-slate-400">Hospital:</span>
                <span className="font-bold">{data[activePointIndex].hospital}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 pt-3 border-t border-slate-100 text-[11px] sm:text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
          <span>Ambulance Requests</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <span>Homecare Requests</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
          <span>Hospital Bookings</span>
        </div>
      </div>
    </div>
  );
};
