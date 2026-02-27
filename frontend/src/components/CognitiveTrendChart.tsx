'use client'

import React from 'react'

interface TrendData {
    label: string
    points: number[]
    color: string
}

interface Props {
    trends: TrendData[]
    width?: number
    height?: number
}

export default function CognitiveTrendChart({ trends, width = 400, height = 150 }: Props) {
    const padding = 20
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    const maxPoints = Math.max(...trends.map(t => t.points.length), 1)
    const maxValue = Math.max(...trends.flatMap(t => t.points), 100)

    return (
        <svg width={width} height={height} className="overflow-visible">
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                <line
                    key={i}
                    x1={padding}
                    y1={padding + chartHeight * (1 - p)}
                    x2={padding + chartWidth}
                    y2={padding + chartHeight * (1 - p)}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                />
            ))}

            {/* Trend Lines */}
            {trends.map((trend, ti) => {
                if (trend.points.length < 2) return null

                const pathData = trend.points.map((val, i) => {
                    const x = padding + (i / (maxPoints - 1)) * chartWidth
                    const y = padding + chartHeight - (val / maxValue) * chartHeight
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                }).join(' ')

                return (
                    <g key={ti}>
                        <path
                            d={pathData}
                            fill="none"
                            stroke={trend.color}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="animate-draw"
                        />
                        {trend.points.map((val, i) => (
                            <circle
                                key={i}
                                cx={padding + (i / (maxPoints - 1)) * chartWidth}
                                cy={padding + chartHeight - (val / maxValue) * chartHeight}
                                r="4"
                                fill={trend.color}
                                stroke="white"
                                strokeWidth="2"
                            />
                        ))}
                    </g>
                )
            })}

            <style jsx>{`
        .animate-draw {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw 2s ease-out forwards;
        }
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
        </svg>
    )
}
