import type { Artwork } from './artworkCatalog'
import { formatElapsedMs } from './gameRules'

interface GameSidebarProps { stage: number; level: number | null; artwork: Artwork; elapsedMs: number }

export function GameSidebar({ stage, level, artwork, elapsedMs }: GameSidebarProps) {
  return <aside className="game-sidebar" aria-label="游戏信息">
    <div className="status-card"><span className="status-label">当前进度</span><strong className="stage-count">第 {stage} / 100 关</strong><span className="level-badge">{level === null ? '练习关' : `正式 Level ${level}`}</span><div className="timer" aria-label={`实时耗时 ${formatElapsedMs(elapsedMs)}`}><span>实时耗时</span><strong>{formatElapsedMs(elapsedMs)}</strong></div></div>
    <section className="artwork-card" aria-labelledby="artwork-heading"><span className="status-label">本关作品</span><h2 id="artwork-heading">{artwork.titleZh} <span>/ {artwork.title}</span></h2><p><b>作者</b>{artwork.artistZh} <span>/ {artwork.artist}</span></p><p><b>年代</b>{artwork.date}</p></section>
  </aside>
}
