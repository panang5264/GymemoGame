import { useState, useRef, useEffect } from 'react'

interface PairMatchingGameProps {
    pairs: { target: string, correct: string }[]
    basePath: string
    onComplete: () => void
    onError: () => void
}

export default function PairMatchingGame({ pairs, basePath, onComplete, onError }: PairMatchingGameProps) {
    const [leftItems, setLeftItems] = useState<{ id: string, file: string }[]>([])
    const [rightItems, setRightItems] = useState<{ id: string, file: string }[]>([])

    const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
    const [selectedRight, setSelectedRight] = useState<string | null>(null)
    const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({}) // leftId -> rightId

    const leftRefs = useRef<Record<string, HTMLButtonElement | null>>({})
    const rightRefs = useRef<Record<string, HTMLButtonElement | null>>({})
    const containerRef = useRef<HTMLDivElement>(null)

    const [lines, setLines] = useState<{ x1: number, y1: number, x2: number, y2: number, color: string }[]>([])

    useEffect(() => {
        // Shuffle the items for display
        const shuffledLeft = [...pairs].map(p => ({ id: p.target, file: p.target })).sort(() => Math.random() - 0.5)
        // Get all right responses, map to the id of what they correct to
        const shuffledRight = [...pairs].map(p => ({ id: p.target, file: p.correct })).sort(() => Math.random() - 0.5)

        setLeftItems(shuffledLeft)
        setRightItems(shuffledRight)
    }, [pairs])

    const updateLines = () => {
        if (!containerRef.current) return
        const containerRect = containerRef.current.getBoundingClientRect()

        const newLines = Object.entries(matchedPairs).map(([leftId, rightId]) => {
            const leftEl = leftRefs.current[leftId]
            const rightEl = rightRefs.current[rightId]

            if (leftEl && rightEl) {
                const lRect = leftEl.getBoundingClientRect()
                const rRect = rightEl.getBoundingClientRect()

                return {
                    x1: lRect.right - containerRect.left,
                    y1: lRect.top + lRect.height / 2 - containerRect.top,
                    x2: rRect.left - containerRect.left,
                    y2: rRect.top + rRect.height / 2 - containerRect.top,
                    color: leftId === rightId ? '#22c55e' : '#eab308' // Green for match, wait actually they only draw if matched... wait, we should only draw CORRECT matches, or let them draw temp lines?
                }
            }
            return null
        }).filter(Boolean) as any[]

        // Add pending line
        if (selectedLeft && !selectedRight && leftRefs.current[selectedLeft]) {
            // Could draw a line following mouse, but for simplicity just highlight
        }

        setLines(newLines.map(l => ({ ...l, color: '#3b82f6' }))) // Blue lines for matches
    }

    useEffect(() => {
        updateLines()
        window.addEventListener('resize', updateLines)
        return () => window.removeEventListener('resize', updateLines)
    }, [matchedPairs, leftItems, rightItems]) // Rerun when matched pairs change

    const handleLeftClick = (id: string) => {
        if (Object.keys(matchedPairs).includes(id)) return // Already matched
        setSelectedLeft(id)
        if (selectedRight) {
            checkMatch(id, selectedRight)
        }
    }

    const handleRightClick = (id: string) => {
        if (Object.values(matchedPairs).includes(id)) return // Already matched
        setSelectedRight(id)
        if (selectedLeft) {
            checkMatch(selectedLeft, id)
        }
    }

    const checkMatch = (leftId: string, rightId: string) => {
        if (leftId === rightId) {
            // Correct!
            const newMatched = { ...matchedPairs, [leftId]: rightId }
            setMatchedPairs(newMatched)
            setSelectedLeft(null)
            setSelectedRight(null)

            if (Object.keys(newMatched).length === pairs.length) {
                onComplete()
            }
        } else {
            // Incorrect
            onError()
            setSelectedLeft(null)
            setSelectedRight(null)
            // Visual feedback could be added here
        }
    }

    return (
        <div className="w-full relative py-8" ref={containerRef}>
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
                {lines.map((line, i) => (
                    <line
                        key={i}
                        x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                        stroke={line.color} strokeWidth="6" strokeLinecap="round"
                        className="animate-in fade-in"
                    />
                ))}
            </svg>

            <div className="flex justify-between w-full max-w-3xl mx-auto px-4 z-20 relative gap-8">
                {/* Left Column */}
                <div className="flex flex-col gap-4 md:gap-6 w-1/2">
                    {leftItems.map((item) => {
                        const isMatched = Object.keys(matchedPairs).includes(item.id)
                        const isSelected = selectedLeft === item.id
                        return (
                            <button
                                key={`l-${item.id}`}
                                ref={el => leftRefs.current[item.id] = el}
                                onClick={() => handleLeftClick(item.id)}
                                disabled={isMatched}
                                className={`flex items-center justify-center p-2 md:p-4 rounded-xl md:rounded-2xl border-2 md:border-4 transition-all w-full h-24 sm:h-32 md:h-40 bg-white
                  ${isMatched ? 'border-blue-500 opacity-50 scale-95' :
                                        isSelected ? 'border-indigo-500 shadow-lg scale-105' :
                                            'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}
                            >
                                <img src={`${basePath}/${item.file}`} className="max-h-full max-w-full object-contain" alt="target" />
                            </button>
                        )
                    })}
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-4 md:gap-6 w-1/2">
                    {rightItems.map((item) => {
                        const isMatched = Object.values(matchedPairs).includes(item.id)
                        const isSelected = selectedRight === item.id
                        return (
                            <button
                                key={`r-${item.id}`}
                                ref={el => rightRefs.current[item.id] = el}
                                onClick={() => handleRightClick(item.id)}
                                disabled={isMatched}
                                className={`flex items-center justify-center p-2 md:p-4 rounded-xl md:rounded-2xl border-2 md:border-4 transition-all w-full h-24 sm:h-32 md:h-40 bg-white
                  ${isMatched ? 'border-blue-500 opacity-50 scale-95' :
                                        isSelected ? 'border-indigo-500 shadow-lg scale-105' :
                                            'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}
                            >
                                <img src={`${basePath}/${item.file}`} className="max-h-full max-w-full object-contain" alt="option" />
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
