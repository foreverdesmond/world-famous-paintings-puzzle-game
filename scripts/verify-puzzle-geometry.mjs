import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { chromium } from 'playwright'

const port = 4174
const baseUrl = `http://127.0.0.1:${port}`
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const server = spawn(npmCommand, ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })

try {
  await waitForServer(`${baseUrl}/`)
  const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  const browser = await chromium.launch({ headless: true, executablePath: existsSync(executablePath) ? executablePath : chromium.executablePath() })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(baseUrl, { waitUntil: 'load' })
  await page.getByRole('button', { name: '开始游戏' }).click()
  await page.waitForTimeout(5200)

  const board = page.locator('[data-testid="puzzle-board"]')
  await board.waitFor({ state: 'visible' })
  await solveTwoByTwo(page)
  await page.waitForTimeout(800)

  const geometry = await page.evaluate(() => {
    const frame = document.querySelector('[data-testid="puzzle-frame"]')
    const board = document.querySelector('[data-testid="puzzle-board"]')
    const result = document.querySelector('.result-panel')
    const measure = (element) => {
      const rect = element.getBoundingClientRect()
      return { x: rect.x, width: rect.width, height: rect.height, right: rect.right, clientWidth: element.clientWidth, clientHeight: element.clientHeight, scrollWidth: element.scrollWidth, scrollHeight: element.scrollHeight }
    }
    return { frame: measure(frame), board: measure(board), result: measure(result), document: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, clientHeight: document.documentElement.clientHeight, scrollHeight: document.documentElement.scrollHeight } }
  })

  const expectedRatio = 1920 / 2861
  const boardRatio = geometry.board.width / geometry.board.height
  assertClose(boardRatio, expectedRatio, 0.002, `Mona Lisa rendered ratio ${boardRatio} != ${expectedRatio}`)
  assert(geometry.board.scrollWidth <= geometry.board.clientWidth, 'board has horizontal scroll overflow')
  assert(geometry.board.scrollHeight <= geometry.board.clientHeight, 'board has vertical scroll overflow')
  assert(geometry.frame.scrollWidth <= geometry.frame.clientWidth, 'frame has horizontal scroll overflow')
  assert(geometry.document.scrollWidth <= geometry.document.clientWidth, 'document has horizontal scroll overflow')
  assertClose(geometry.result.width, geometry.frame.width, 0.5, 'result width does not match frame width')
  assertClose(geometry.result.x + geometry.result.width / 2, geometry.frame.x + geometry.frame.width / 2, 0.5, 'result center does not match frame center')
  console.log(JSON.stringify({ geometry, boardRatio, expectedRatio, assertions: 7 }, null, 2))
  await browser.close()
} finally {
  server.kill('SIGTERM')
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Vite server did not start at ${url}`)
}

async function solveTwoByTwo(page) {
  for (let target = 0; target < 4; target += 1) {
    const positions = await page.locator('.puzzle-tile').evaluateAll((tiles) => tiles.map((tile) => tile.getAttribute('style') ?? ''))
    const expectedX = target % 2 === 0 ? '0%' : '100%'
    const expectedY = target < 2 ? '0%' : '100%'
    const sourceIndex = positions.findIndex((style) => style.includes(`background-position: ${expectedX} ${expectedY}`))
    if (sourceIndex < 0) throw new Error(`Could not find source tile for position ${target}`)
    if (sourceIndex !== target) {
      await page.locator('.puzzle-tile').nth(target).click()
      await page.locator('.puzzle-tile').nth(sourceIndex).click()
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertClose(actual, expected, tolerance, message) {
  assert(Math.abs(actual - expected) <= tolerance, message)
}
