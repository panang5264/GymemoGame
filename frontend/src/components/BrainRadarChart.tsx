'use client'

import React from 'react'

interface RadarData {
    label: string
    value: number // 0 to 100
    color: string
}

interface Props {
    data: RadarData[]
    size?: number
}

export default function BrainRadarChart({ data, size = 300 }: Props) {
    const center = size / 2
    const radius = (size / 2) * 0.7
    const angleStep = (Math.PI * 2) / data.length

    // Generate background circles
    const bgCircles = [0.2, 0.4, 0.6, 0.8, 1].map((p, i) => (
        <circle
            key={i}
            cx={center}
            cy={center}
            r={radius * p}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray="4 4"
        />
    ))

    // Generate axes
    const axes = data.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2
        const x2 = center + Math.cos(angle) * radius
        const y2 = center + Math.sin(angle) * radius
        return (
            <line
                key={i}
                x1={center}
                y1={center}
                x2={x2}
                y2={y2}
                stroke="#e2e8f0"
                strokeWidth="1"
            />
        )
    })

    // Generate data points and path
    const points = data.map((d, i) => {
        const angle = i * angleStep - Math.PI / 2
        const valRadius = (d.value / 100) * radius
        return {
            x: center + Math.cos(angle) * valRadius,
            y: center + Math.sin(angle) * valRadius
        }
    })

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

    // Labels
    const labels = data.map((d, i) => {
        const angle = i * angleStep - Math.PI / 2
        const labelRadius = radius + 25
        const x = center + Math.cos(angle) * labelRadius
        const y = center + Math.sin(angle) * labelRadius
        return (
            <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] font-black fill-slate-400 uppercase tracking-tighter"
            >
                {d.label}
            </text>
        )
    })

    return (
        <div className="flex justify-center items-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background */}
                {bgCircles}
                {axes}

                {/* Data Path */}
                <path
                    d={pathData}
                    fill="rgba(79, 70, 229, 0.2)"
                    stroke="#4f46e5"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    className="animate-in fade-in zoom-in duration-1000"
                />

                {/* Points */}
                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        fill="#4f46e5"
                        stroke="white"
                        strokeWidth="2"
                    />
                ))}

                {/* Labels */}
                {labels}
            </svg>
        </div>
    )
}
