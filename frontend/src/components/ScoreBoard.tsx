interface ScoreBoardProps {
  score: number
  moves: number
}

export default function ScoreBoard({ score, moves }: ScoreBoardProps) {
  return (
    <div className="score-board">
      <div className="score-item">
        <span className="score-label">คะแนน:</span>
        <span className="score-value">{score}</span>
      </div>
      <div className="score-item">
        <span className="score-label">จำนวนครั้ง:</span>
        <span className="score-value">{moves}</span>
      </div>
    </div>
  )
}
