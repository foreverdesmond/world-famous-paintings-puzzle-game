import type { SessionStatus } from './useGameSession'
import { formatElapsedMs } from './gameRules'

interface ResultDialogProps {
  status: Extract<SessionStatus, 'completed' | 'final-completed' | 'fault'>
  elapsedMs?: number
  onNextStage?: () => void
  onExit: () => void
}

export function ResultDialog({ status, elapsedMs = 0, onNextStage, onExit }: ResultDialogProps) {
  const isFault = status === 'fault'
  const isFinal = status === 'final-completed'

  return (
    <section className={`result-panel${isFinal ? ' final-result' : ''}${isFault ? ' fault-result' : ''}`} aria-live="polite" aria-labelledby="result-heading">
      <div className="result-icon" aria-hidden="true">{isFault ? '!' : isFinal ? '✦' : '✓'}</div>
      <p className="eyebrow">{isFault ? 'GAME ERROR' : isFinal ? 'MASTERPIECE COMPLETE' : 'PUZZLE COMPLETE'}</p>
      <h2 id="result-heading">{isFault ? '游戏故障' : isFinal ? '恭喜完成全部关卡' : '本关通关'}</h2>
      {isFault ? <p className="result-copy">图片连续加载失败，当前游戏无法继续。</p> : <p className="result-copy">本关耗时 <strong>{formatElapsedMs(elapsedMs)}</strong></p>}
      <div className="result-actions">
        {!isFault && !isFinal && <button className="primary-button" type="button" onClick={onNextStage}>下一关</button>}
        <button className="secondary-button" type="button" onClick={onExit}>退出游戏</button>
      </div>
    </section>
  )
}
