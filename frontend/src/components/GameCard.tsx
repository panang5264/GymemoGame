interface GameCardProps {
  emoji: string
  isFlipped: boolean
  isMatched: boolean
  onClick: () => void
}

export default function GameCard({ emoji, isFlipped, isMatched, onClick }: GameCardProps) {
  return (
    <div 
      className={`game-card ${isFlipped || isMatched ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
      onClick={onClick}
    >
      <div className="card-inner">
        <div className="card-front">❓</div>
        <div className="card-back">{emoji}</div>
      </div>
    </div>
  )
}
