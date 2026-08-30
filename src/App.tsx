import { artworkCatalog } from './artworkCatalog'
import { getArtworkOrientation, getGridSize } from './gameRules'
import { GameSidebar } from './GameSidebar'
import { PuzzleBoard } from './PuzzleBoard'
import { PreviewArtwork } from './PreviewArtwork'
import { PuzzleFrame } from './PuzzleFrame'
import { ResultDialog } from './ResultDialog'
import { useGameSession } from './useGameSession'

export function App() {
  const game = useGameSession({ artworks: artworkCatalog })
  const session = game.session
  if (game.status === 'fault') return <main className="app-shell result-page"><header className="game-header"><div><p className="eyebrow">WORLD FAMOUS PAINTINGS</p><h1>世界名画拼图小游戏</h1></div></header><ResultDialog status="fault" onExit={game.exitGame} /></main>
  if (game.status === 'idle' || !session) return <main className="app-shell landing-page"><p className="eyebrow">WORLD FAMOUS PAINTINGS</p><h1>世界名画拼图小游戏</h1><p className="intro">观察名画，交换切片，完成你的艺术拼图。</p><button className="primary-button start-button" type="button" onClick={game.startGame}>开始游戏</button></main>

  const grid = getGridSize(session.stage, getArtworkOrientation(session.artwork.width, session.artwork.height))
  const isPreview = game.status === 'preview'
  const isCelebrating = game.status === 'celebrating'
  const resultStatus = game.status === 'completed' || game.status === 'final-completed' ? game.status : null
  return <main className="app-shell game-page">
    <header className="game-header"><div><p className="eyebrow">WORLD FAMOUS PAINTINGS</p><h1>世界名画拼图小游戏</h1></div><button className="text-button" type="button" onClick={game.exitGame}>退出游戏</button></header>
    <div className="mobile-gate" role="status"><span className="gate-icon">↻</span><strong>请横向旋转设备后继续游戏</strong><span>需要至少 640px 宽度以显示棋盘</span></div>
    <div className="game-layout"><section className="board-panel" aria-label="拼图区域">
      <PuzzleFrame>
        {isPreview ? <>
          <div className="preview-note">原图预览 · 5 秒</div>
          <PreviewArtwork artwork={session.artwork} />
        </> : <PuzzleBoard board={session.board} artwork={session.artwork} selectedTileIndex={session.selectedTileIndex} celebrating={isCelebrating} disabled={game.status !== 'playing'} onTileClick={game.clickTile} />}
      </PuzzleFrame>
      {resultStatus && <ResultDialog status={resultStatus} elapsedMs={game.elapsedMs} onNextStage={game.nextStage} onExit={game.exitGame} />}
    </section><GameSidebar stage={session.stage} level={grid.level} artwork={session.artwork} elapsedMs={game.elapsedMs} /></div>
  </main>
}
