'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { recordPlay, markDailyMode } from '@/lib/levelSystem'
import ClockIntro from '@/components/ClockIntro'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Item {
  id: string
  label: string
  emoji: string
  tags: string[]
  createdAt?: number
  x?: number
  y?: number
}

interface Category {
  id: string
  title: string
  emoji: string
  accepts: (item: Item) => boolean
}

type GameMode = 'sorting' | 'cooking' | 'maze' | 'matching'

// ─── Constants ───────────────────────────────────────────────────────────────

const ITEM_LIFETIME = 7000
const MAX_ACTIVE_ITEMS = 3
const MAZE_FADE_TIME = 3000

// ─── Helper: Random Position ────────────────────────────────────────────────

function getRandomPos() {
  return {
    x: 15 + Math.random() * 70,
    y: 15 + Math.random() * 50,
  }
}

// ─── Level Definitions ───────────────────────────────────────────────────────

const COOKING_RECIPES = [
  { name: 'แตงกวาผัดไข่', ingredients: ['🥒', '🥚', '🧂'] },
  { name: 'ผัดไทยกุ้ง', ingredients: ['🍝', '🍤', '🥜'] },
  { name: 'กะเพราหมูสับ', ingredients: ['🐷', '🌿', '🌶️'] },
]

// ─── Procedural Maze Generator ──────────────────────────────────────────────

function generateMaze(rows: number, cols: number, hasKey: boolean, hasBombs: boolean) {
  const maze = Array.from({ length: rows }, () => Array(cols).fill(1)) // 1 = Wall
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false))

  function walk(r: number, c: number) {
    visited[r][c] = true
    maze[r][c] = 0 // Path

    const directions = [[0, 2], [0, -2], [2, 0], [-2, 0]].sort(() => Math.random() - 0.5)
    for (const [dr, dc] of directions) {
      const nr = r + dr, nc = c + dc
      if (nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1 && !visited[nr][nc]) {
        maze[r + dr / 2][c + dc / 2] = 0
        walk(nr, nc)
      }
    }
  }

  walk(1, 1)
  maze[rows - 2][cols - 2] = 2 // Exit (Flag)

  // Reachability check (BFS)
  function canReach(startR: number, startC: number, endR: number, endC: number, currentMaze: number[][]) {
    const q = [[startR, startC]]
    const v = Array.from({ length: rows }, () => Array(cols).fill(false))
    v[startR][startC] = true
    while (q.length > 0) {
      const [r, c] = q.shift()!
      if (r === endR && c === endC) return true
      for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nr = r + dr, nc = c + dc
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && currentMaze[nr][nc] !== 1 && currentMaze[nr][nc] !== 4 && !v[nr][nc]) {
          v[nr][nc] = true
          q.push([nr, nc])
        }
      }
    }
    return false
  }

  if (hasKey) {
    // Place key at a random path (not start/end)
    let placed = false
    while (!placed) {
      const kr = Math.floor(Math.random() * (rows - 2)) + 1
      const kc = Math.floor(Math.random() * (cols - 2)) + 1
      if (maze[kr][kc] === 0 && (kr !== 1 || kc !== 1) && (kr !== rows - 2 || kc !== cols - 2)) {
        maze[kr][kc] = 3
        placed = true
      }
    }
  }

  if (hasBombs) {
    let bombAttempts = 0
    while (bombAttempts < 50) { // Try placing bombs up to 50 times to ensure reachability
      const tempMaze = maze.map(row => [...row]) // Create a temporary maze for bomb placement
      const keyPos = hasKey ? (() => {
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (tempMaze[r][c] === 3) return { r, c };
        return null;
      })() : null;

      // Place bombs randomly on the temporary maze
      for (let i = 0; i < 3; i++) {
        const br = Math.floor(Math.random() * (rows - 2)) + 1
        const bc = Math.floor(Math.random() * (cols - 2)) + 1
        if (tempMaze[br][bc] === 0 && (br !== 1 || bc !== 1) && (br !== rows - 2 || bc !== cols - 2)) tempMaze[br][bc] = 4
      }

      // Check if start -> key (if exists) -> exit is still possible with the new bombs
      const startToExit = canReach(1, 1, rows - 2, cols - 2, tempMaze)
      const startToKey = keyPos ? canReach(1, 1, keyPos.r, keyPos.c, tempMaze) : true
      const keyToExit = keyPos ? canReach(keyPos.r, keyPos.c, rows - 2, cols - 2, tempMaze) : true

      if (startToExit && startToKey && keyToExit) {
        // If reachable, commit the bomb placement
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) maze[r][c] = tempMaze[r][c];
        break // Exit the bomb placement loop
      }
      bombAttempts++
    }
  }

  return maze
}

function getLevelConfig(level: number) {
  let mode: GameMode = 'sorting'
  let items: Item[] = []
  let categories: Category[] = []
  let instruction = 'ทำภารกิจให้สำเร็จตามที่กำหนด'

  switch (level) {
    case 1:
      instruction = 'จงแยกวัตถุที่มีสีแดง และวัตถุทรงกลม'
      categories = [
        { id: 'red', title: 'สีแดง 🔴', emoji: '📦', accepts: i => i.tags.includes('red') },
        { id: 'sphere', title: 'ทรงกลม 🔵', emoji: '📦', accepts: i => i.tags.includes('sphere') },
      ]
      items = [
        { id: 'r1', label: 'แอปเปิล', emoji: '🍎', tags: ['red'] },
        { id: 'r2', label: 'พริก', emoji: '🌶️', tags: ['red'] },
        { id: 'r3', label: 'โคมไฟ', emoji: '🏮', tags: ['red'] },
        { id: 'r4', label: 'อั่งเปา', emoji: '🧧', tags: ['red'] },
        { id: 'r5', label: 'กุหลาบ', emoji: '🌹', tags: ['red'] },
        { id: 's1', label: 'ลูกบอล', emoji: '⚽', tags: ['sphere'] },
        { id: 's2', label: 'บาสเกตบอล', emoji: '🏀', tags: ['sphere'] },
        { id: 's3', label: 'ไหมพรม', emoji: '🧶', tags: ['sphere'] },
        { id: 's4', label: 'ลูกแก้ว', emoji: '🔮', tags: ['sphere'] },
        { id: 's5', label: 'ฟองสบู่', emoji: '🫧', tags: ['sphere'] },
        { id: 'o1', label: 'กล้วย', emoji: '🍌', tags: [] },
        { id: 'o2', label: 'บรอกโคลี', emoji: '🥦', tags: [] },
        { id: 'o3', label: 'จักรยาน', emoji: '🚲', tags: [] },
        { id: 'o4', label: 'หนังสือ', emoji: '📚', tags: [] },
        { id: 'o5', label: 'กุญแจ', emoji: '🔑', tags: [] },
      ]
      break

    case 2:
      instruction = 'แยกสัตว์ที่เดิน 4 ขา และวัตถุที่ใช้ขัด/แปรง'
      categories = [
        { id: 'animal4', title: 'สัตว์ 4 ขา 🐕', emoji: '📦', accepts: i => i.tags.includes('animal4') },
        { id: 'scrubber', title: 'วัตถุขัด/แปรง 🧽', emoji: '📦', accepts: i => i.tags.includes('scrubber') },
      ]
      items = [
        { id: 'a1', label: 'สุนัข', emoji: '🐕', tags: ['animal4'] },
        { id: 'a2', label: 'แมว', emoji: '🐈', tags: ['animal4'] },
        { id: 'a3', label: 'ช้าง', emoji: '🐘', tags: ['animal4'] },
        { id: 'a4', label: 'วัว', emoji: '🐄', tags: ['animal4'] },
        { id: 'a5', label: 'ม้า', emoji: '🐎', tags: ['animal4'] },
        { id: 'sc1', label: 'แปรงสีฟัน', emoji: '🪥', tags: ['scrubber'] },
        { id: 'sc2', label: 'ฟองน้ำ', emoji: '🧽', tags: ['scrubber'] },
        { id: 'sc3', label: 'ไม้กวาด', emoji: '🧹', tags: ['scrubber'] },
        { id: 'sc4', label: 'แปรงขัด', emoji: '🧺', tags: ['scrubber'] },
        { id: 'sc5', label: 'สก๊อตไบร์ท', emoji: '🧼', tags: ['scrubber'] },
        { id: 'o1', label: 'นก', emoji: '🐦', tags: [] },
        { id: 'o2', label: 'ปลา', emoji: '🐟', tags: [] },
        { id: 'o3', label: 'ร่ม', emoji: '☂️', tags: [] },
        { id: 'o4', label: 'นาฬิกา', emoji: '⏰', tags: [] },
        { id: 'o5', label: 'โทรศัพท์', emoji: '📱', tags: [] },
      ]
      break

    case 3:
      instruction = 'สลับภาชนะทุกครั้งที่จัดถูก 2 ครั้ง'
      categories = [
        { id: 'animal4', title: 'สัตว์ 4 ขา', emoji: '📦', accepts: i => i.tags.includes('animal4') },
        { id: 'scrubber', title: 'วัตถุขัด/แปรง', emoji: '📦', accepts: i => i.tags.includes('scrubber') },
      ]
      items = [
        { id: 'a1', label: 'สุนัข', emoji: '🐕', tags: ['animal4'] },
        { id: 'a2', label: 'แมว', emoji: '🐈', tags: ['animal4'] },
        { id: 'a3', label: 'ช้าง', emoji: '🐘', tags: ['animal4'] },
        { id: 'a4', label: 'วัว', emoji: '🐄', tags: ['animal4'] },
        { id: 'a5', label: 'ม้า', emoji: '🐎', tags: ['animal4'] },
        { id: 'sc1', label: 'แปรงสีฟัน', emoji: '🪥', tags: ['scrubber'] },
        { id: 'sc2', label: 'ฟองน้ำ', emoji: '🧽', tags: ['scrubber'] },
        { id: 'sc3', label: 'ไม้กวาด', emoji: '🧹', tags: ['scrubber'] },
        { id: 'sc4', label: 'แปรงขัด', emoji: '🧺', tags: ['scrubber'] },
        { id: 'sc5', label: 'สก๊อตไบร์ท', emoji: '🧼', tags: ['scrubber'] },
        { id: 'r1', label: 'พริก', emoji: '🌶️', tags: ['red', 'animal4'] },
        { id: 's1', label: 'ลูกบอล', emoji: '⚽', tags: ['sphere', 'scrubber'] },
        { id: 'a6', label: 'กวาง', emoji: '🦌', tags: ['animal4'] },
        { id: 'a7', label: 'หมู', emoji: '🐷', tags: ['animal4'] },
        { id: 'sc6', label: 'ที่เปิดขวด', emoji: '🍾', tags: ['scrubber'] },
      ].sort(() => Math.random() - 0.5)
      break

    case 4:
    case 5:
      mode = 'cooking'
      instruction = level === 4 ? 'ปรุงอาหารตามคำสั่งที่ปรากฏ (จำคำสั่งให้ดี!)' : 'ปรุงอาหารและปรับรสชาติพิเศษ'
      break

    case 6:
      mode = 'maze'
      instruction = 'เดินหาทางออกจากจุดเริ่มต้นไปยังธงสีเขียว (หากไม่เดินจะจางหาย)'
      break
    case 7:
      mode = 'maze'
      instruction = 'ต้องหากุญแจเพื่อไขทองออกจากเขาวงกต'
      break
    case 8:
      mode = 'maze'
      instruction = 'จำตำแหน่งระเบิดให้ดี! ระเบิดจะซ่อนเมื่อเริ่มเดิน (ต้องหากุญแจด้วย)'
      break
    case 9:
      mode = 'maze'
      instruction = 'ระวัง! การควบคุมจะตรงกันข้าม และระเบิดจะถูกซ่อนไว้ (ต้องหากุญแจด้วย)'
      break
    case 10:
      mode = 'matching'
      instruction = 'จับคู่คำพูด/วลีให้ตรงหมวดหมู่'
      break
  }

  return { mode, items: items.sort(() => Math.random() - 0.5), categories, instruction }
}

// ─── Main Component ──────────────────────────────────────────────────────────

function ManagementGameInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subId = parseInt(searchParams.get('subId') || '1', 10)
  const levelParam = parseInt(searchParams.get('level') || '1', 10)
  const villageId = parseInt(searchParams.get('villageId') || '1', 10)
  const modeParam = searchParams.get('mode')

  const [phase, setPhase] = useState<'intro' | 'clock' | 'play' | 'done'>('intro')
  const [clockTarget] = useState(() => ({
    h: Math.floor(Math.random() * 12) + 1,
    m: [0, 15, 30, 45][Math.floor(Math.random() * 4)]
  }))
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong', message: string } | null>(null)

  // Sorting State
  const [config, setConfig] = useState(() => getLevelConfig(levelParam))
  const [spawnQueue, setSpawnQueue] = useState<Item[]>([])
  const [activePool, setActivePool] = useState<Item[]>([])
  const [correctCount, setCorrectCount] = useState(0)

  // Cooking State
  const [dishIndex, setDishIndex] = useState(0)
  const [showCookingOrder, setShowCookingOrder] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<string[]>([])
  const [collectedIngredients, setCollectedIngredients] = useState<string[]>([])
  const [cookingItems, setCookingItems] = useState<string[]>([])

  // Maze State
  const [maze, setMaze] = useState<number[][]>([])
  const [playerPos, setPlayerPos] = useState({ r: 0, c: 0 })
  const [hasKey, setHasKey] = useState(false)
  const [showBombs, setShowBombs] = useState(false)
  const [lastMoveTime, setLastMoveTime] = useState(Date.now())
  const [isMazeHidden, setIsMazeHidden] = useState(false)

  // Matching State
  const [matchingPairs, setMatchingPairs] = useState<{ id: number, left: string, right: string, matched: boolean }[]>([])
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null)
  const [shuffledRight, setShuffledRight] = useState<{ text: string, id: number }[]>([])

  // Initialization
  useEffect(() => {
    const c = getLevelConfig(levelParam)
    setConfig(c)
    setSpawnQueue(c.items)

    if (c.mode === 'maze') {
      const rows = 9 + (levelParam > 7 ? 2 : 0)
      const cols = 9 + (levelParam > 7 ? 2 : 0)
      const needsKey = levelParam >= 7
      const needsBombs = levelParam >= 8

      const mazeLayout = generateMaze(rows, cols, needsKey, needsBombs)
      setMaze(mazeLayout)
      setPlayerPos({ r: 1, c: 1 })
      setHasKey(false)
      setShowBombs(needsBombs) // Visible initially for level 8, 9
      setLastMoveTime(Date.now())
    }

    if (c.mode === 'cooking') {
      setDishIndex(0)
      startNewCookingDish(0)
    }

    if (c.mode === 'matching') {
      const phrases = [
        { left: 'สวัสดีครับ', right: 'การทักทาย' },
        { left: 'ขอบคุณมากนะครับ', right: 'การขอบคุณ' },
        { left: 'ผมขอโทษจริงๆ ครับ', right: 'การขออภัย' },
        { left: 'ยินดีที่ได้รู้จักครับ', right: 'การทำความรู้จัก' },
        { left: 'ขอให้โชคดีนะ', right: 'การอวยพร' },
      ]
      const pairs = phrases.map((p, idx) => ({ ...p, id: idx, matched: false }))
      setMatchingPairs(pairs)

      const shuffled = pairs.map(p => ({ text: p.right, id: p.id })).sort(() => Math.random() - 0.5)
      setShuffledRight(shuffled)
    }
  }, [levelParam])

  // Spawning Logic (Sorting Only)
  useEffect(() => {
    if (phase !== 'play' || config.mode !== 'sorting') return

    const interval = setInterval(() => {
      setActivePool(prev => {
        if (prev.length >= MAX_ACTIVE_ITEMS || spawnQueue.length === 0) return prev
        const nextItem = spawnQueue[0]
        const { x, y } = getRandomPos()
        const newItem = { ...nextItem, createdAt: Date.now(), x, y }
        setSpawnQueue(sq => sq.slice(1))
        return [...prev, newItem]
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [phase, spawnQueue, config.mode])

  // Expiration & Fade Logic
  useEffect(() => {
    if (phase !== 'play') return

    const interval = setInterval(() => {
      const now = Date.now()

      // Sorting cleanup
      if (config.mode === 'sorting') {
        setActivePool(prev => prev.filter(item => item.createdAt && (now - item.createdAt < ITEM_LIFETIME)))
      }

      // Maze fade logic (L6)
      if (config.mode === 'maze' && levelParam === 6) {
        setIsMazeHidden(now - lastMoveTime > MAZE_FADE_TIME)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [phase, config.mode, lastMoveTime, levelParam])

  // Sorting Handler
  const handleSortItem = (itemId: string, catId: string) => {
    const item = activePool.find(i => i.id === itemId)
    const category = config.categories.find(c => c.id === catId)
    if (!item || !category) return

    const isCorrect = category.accepts(item)
    if (isCorrect) {
      setScore(s => s + 1)
      setFeedback({ type: 'correct', message: '✨ ถูกต้อง!' })
      setCorrectCount(prev => {
        const newCount = prev + 1
        if (levelParam === 3 && newCount % 2 === 0) {
          setConfig(prevCfg => ({ ...prevCfg, categories: [...prevCfg.categories].reverse() }))
          setFeedback({ type: 'correct', message: '🔄 สับเปลี่ยนภาชนะ!' })
        }
        return newCount
      })
    } else {
      setScore(s => s - 1)
      setFeedback({ type: 'wrong', message: '❌ ผิดหมวด!' })
    }
    setActivePool(prev => prev.filter(i => i.id !== itemId))
    setTimeout(() => setFeedback(null), 1000)
  }

  // Cooking Handlers
  const startNewCookingDish = (idx: number) => {
    if (idx >= COOKING_RECIPES.length) {
      setPhase('done')
      return
    }
    const recipe = COOKING_RECIPES[idx]
    setCurrentOrder(recipe.ingredients)
    setCollectedIngredients([])
    setShowCookingOrder(true)

    // Generate random ingredients including distractors
    const pool = ['🥒', '🥚', '🧂', '🍝', '🍤', '🥜', '🐷', '🌿', '🌶️', '🦪', '🥡', '🥦', '🧅']
    const items = [...recipe.ingredients, ...pool.sort(() => Math.random() - 0.5).slice(0, 5)].sort(() => Math.random() - 0.5)
    setCookingItems(items)

    setTimeout(() => setShowCookingOrder(false), 3000)
  }

  const handleCookIngredient = (ing: string) => {
    const isCorrect = currentOrder[collectedIngredients.length] === ing
    if (isCorrect) {
      const next = [...collectedIngredients, ing]
      setCollectedIngredients(next)
      if (next.length === currentOrder.length) {
        setScore(s => s + 1)
        setFeedback({ type: 'correct', message: '🍽️ ปรุงเสร็จแล้ว!' })
        setTimeout(() => {
          setDishIndex(d => d + 1)
          startNewCookingDish(dishIndex + 1)
        }, 1000)
      }
    } else {
      setFeedback({ type: 'wrong', message: '❌ ผิดสูตรนะ!' })
      setTimeout(() => setFeedback(null), 1000)
    }
  }

  // Maze Handlers
  const playerPosRef = useRef(playerPos)
  useEffect(() => { playerPosRef.current = playerPos }, [playerPos])

  const handleMazeMove = useCallback((dr: number, dc: number) => {
    if (phase !== 'play') return
    setLastMoveTime(Date.now())
    setIsMazeHidden(false)

    const currentPos = playerPosRef.current

    // Hide bombs after first move for level 8 & 9
    if ((levelParam === 8 || levelParam === 9) && showBombs) {
      setShowBombs(false)
    }

    const moveR = levelParam === 9 ? -dr : dr
    const moveC = levelParam === 9 ? -dc : dc
    const nr = currentPos.r + moveR
    const nc = currentPos.c + moveC

    if (nr < 0 || nr >= maze.length || nc < 0 || nc >= maze[0].length || maze[nr][nc] === 1) return

    if (maze[nr][nc] === 4) {
      setFeedback({ type: 'wrong', message: '💣 ตูม! เริ่มใหม่นะ' })
      setPlayerPos({ r: 1, c: 1 })
      setTimeout(() => setFeedback(null), 1000)
      return
    }
    if (maze[nr][nc] === 3) {
      setHasKey(true)
      const newMaze = maze.map(row => [...row])
      newMaze[nr][nc] = 0
      setMaze(newMaze)
      setFeedback({ type: 'correct', message: '🔑 ได้กุญแจแล้ว!' })
      setTimeout(() => setFeedback(null), 1000)
    }
    if (maze[nr][nc] === 2) {
      if (levelParam >= 7 && !hasKey) {
        setFeedback({ type: 'wrong', message: '🔒 หากุญแจก่อนเถอะ!' })
        setTimeout(() => setFeedback(null), 1000)
        return
      }
      setScore(100)
      setPhase('done')
      return
    }
    setPlayerPos({ r: nr, c: nc })
  }, [phase, maze, levelParam, showBombs, hasKey])

  // Keyboard controls for Maze
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (config.mode !== 'maze' || phase !== 'play') return
      switch (e.key) {
        case 'ArrowUp': case 'w': e.preventDefault(); handleMazeMove(-1, 0); break
        case 'ArrowDown': case 's': e.preventDefault(); handleMazeMove(1, 0); break
        case 'ArrowLeft': case 'a': e.preventDefault(); handleMazeMove(0, -1); break
        case 'ArrowRight': case 'd': e.preventDefault(); handleMazeMove(0, 1); break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [config.mode, phase, handleMazeMove])

  // Matching Handlers
  const handleMatchClick = (side: 'left' | 'right', id: number) => {
    if (side === 'left') {
      setSelectedLeft(id)
    } else if (selectedLeft !== null) {
      if (selectedLeft === id) {
        setScore(s => s + 2)
        setFeedback({ type: 'correct', message: '✨ จับคู่สำเร็จ!' })
        setMatchingPairs(prev => prev.map(p => p.id === id ? { ...p, matched: true } : p))
        setSelectedLeft(null)
        if (matchingPairs.filter(p => !p.matched).length === 1) {
          setTimeout(() => setPhase('done'), 1000)
        }
      } else {
        setFeedback({ type: 'wrong', message: '❌ ยังไม่ใช่หมวดที่ตรงกัน' })
        setSelectedLeft(null)
      }
    }
  }

  // Auto-finish sorting
  useEffect(() => {
    const handleCheat = () => {
      setScore(999)
      setPhase('done')
    }
    window.addEventListener('gymemo:cheat_complete', handleCheat)
    return () => window.removeEventListener('gymemo:cheat_complete', handleCheat)
  }, [])

  useEffect(() => {
    if (phase === 'play' && activePool.length === 0 && spawnQueue.length === 0 && config.mode === 'sorting') {
      setPhase('done')
    }
  }, [activePool, spawnQueue, phase, config.mode])

  // Persistence
  useEffect(() => {
    if (phase === 'done') {
      if (modeParam === 'village') recordPlay(villageId, score, 'management', subId)
      else if (modeParam === 'daily') {
        const dk = new Date().toISOString().split('T')[0]
        localStorage.setItem(`gymemo_mgmt_daily_${dk}`, JSON.stringify({ score }))
        markDailyMode(dk, 'management')
      }
    }
  }, [phase, modeParam, villageId, score, subId])

  // ─── Render Components ──────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center justify-center p-4 selection:bg-indigo-100 h-full w-full font-['Supermarket']">
      <div className="w-full max-w-5xl bg-white rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[550px] max-h-[850px] relative border border-slate-100">

        {/* Header Bar */}
        <div className="h-20 bg-white border-b-2 border-slate-50 flex items-center justify-between px-6 md:px-10 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl md:text-3xl">
              {levelParam <= 3 ? '📦' : levelParam <= 5 ? '🍳' : levelParam <= 9 ? '🧭' : '📝'}
            </div>
            <h1 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight">
              {config.instruction}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</span>
              <span className="text-4xl font-black text-indigo-600 tabular-nums">{score}</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden bg-slate-50/50">

          {feedback && (
            <div className={`absolute top-10 left-1/2 -translate-x-1/2 z-[100] px-10 py-3 rounded-full font-black text-xl shadow-2xl transition-all border-4 ${feedback.type === 'correct' ? 'bg-green-500 text-white border-green-300' : 'bg-red-500 text-white border-red-300 animate-shake'
              }`}>
              {feedback.message}
            </div>
          )}

          {phase === 'intro' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-sm p-10">
              <div className="max-w-md w-full bg-white rounded-[40px] p-10 shadow-2xl border border-slate-100 text-center animate-in zoom-in">
                <div className="text-9xl mb-8 animate-bounce">
                  {levelParam <= 3 ? '📦' : levelParam <= 5 ? '🍳' : levelParam <= 9 ? '🧭' : '📝'}
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-tighter">Level {levelParam}</h3>
                <p className="text-slate-500 font-bold mb-12 text-lg">{config.instruction}</p>
                <button
                  onClick={() => {
                    if (levelParam === 1 && modeParam !== 'village') setPhase('clock')
                    else setPhase('play')
                  }}
                  className="w-full py-5 bg-slate-800 text-white rounded-[24px] font-black text-2xl shadow-xl hover:scale-105 transition-all active:scale-95"
                >
                  เริ่มภารกิจ 🚀
                </button>
              </div>
            </div>
          )}

          {phase === 'clock' && (
            <ClockIntro
              targetHour={clockTarget.h}
              targetMinute={clockTarget.m}
              onComplete={() => setPhase('play')}
            />
          )}

          {phase === 'done' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-md p-6">
              <div className="max-w-[400px] w-full bg-white rounded-[48px] p-10 md:p-12 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] border border-white text-center animate-in zoom-in">
                <div className="relative mb-4 flex justify-center">
                  <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 animate-pulse" />
                  <div className="text-8xl relative drop-shadow-2xl">🎯</div>
                </div>
                <h3 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">
                  คะแนนที่ทำได้
                </h3>
                <p className="text-slate-400 font-bold mb-8 uppercase tracking-[0.2em] text-[10px]">เลเวล {levelParam} — คะแนนสะสม {score}</p>
                <div className="flex flex-col gap-3">
                  {modeParam === 'village' ? (
                    <>
                      {subId < 12 ? (
                        <button
                          onClick={() => router.push(`/world/${villageId}/sublevel/${subId + 1}`)}
                          className="w-full py-5 bg-green-500 hover:bg-green-600 text-white rounded-[24px] font-black text-2xl shadow-xl transition-all active:scale-95"
                        >
                          ด่านต่อไป 🚀
                        </button>
                      ) : villageId < 10 ? (
                        <button
                          onClick={() => router.push(`/world/${villageId + 1}`)}
                          className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white rounded-[24px] font-black text-2xl shadow-xl transition-all active:scale-95"
                        >
                          หมู่บ้านต่อไป 🏘️
                        </button>
                      ) : null}
                      <button
                        onClick={() => router.push(`/world/${villageId}?showSummary=1`)}
                        className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[24px] font-black text-lg transition-all"
                      >
                        กลับสู่แผนที่ 🗺️
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => router.push(modeParam === 'daily' ? '/daily-challenge' : '/world')}
                      className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] font-black text-2xl shadow-[0_12px_24px_-6px_rgba(79,70,229,0.4)] transition-all hover:-translate-y-1 active:scale-95 active:translate-y-0"
                    >
                      ตกลง ✨
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {phase === 'play' && (
            <div className="w-full h-full">
              {config.mode === 'sorting' && (
                <div className="w-full h-full flex flex-col items-center">
                  <div className="flex-1 w-full relative">
                    {activePool.map(item => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData('itemId', item.id); e.currentTarget.style.opacity = '0.4' }}
                        onDragEnd={(e) => { e.currentTarget.style.opacity = '1' }}
                        className="absolute w-28 h-28 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing z-10 select-none animate-in fade-in zoom-in"
                        style={{ left: `${item.x}%`, top: `${item.y}%`, transform: 'translate(-50%, -50%)' }}
                      >
                        <span className="text-7xl drop-shadow-2xl">{item.emoji}</span>
                        <div className="mt-2 bg-white/90 px-3 py-1 rounded-xl shadow-lg text-xs font-black text-slate-600">
                          {item.label}
                        </div>
                        <div className="absolute -bottom-4 left-4 right-4 h-2 bg-slate-100 rounded-full overflow-hidden border border-white">
                          <div className="h-full bg-pink-500 transition-all linear" style={{ width: `${Math.max(0, 100 - ((Date.now() - (item.createdAt || 0)) / ITEM_LIFETIME * 100))}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="h-44 w-full flex justify-center gap-12 md:gap-24 px-10 pb-8">
                    {config.categories.map(cat => (
                      <div key={cat.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleSortItem(e.dataTransfer.getData('itemId'), cat.id)} className="flex flex-col items-center group">
                        <div className="w-32 h-24 md:w-48 md:h-32 bg-white rounded-[40px] border-4 border-dashed border-slate-200 shadow-2xl flex items-center justify-center group-hover:border-blue-300 transition-all">
                          <span className="text-7xl md:text-8xl drop-shadow-xl transition-transform duration-500 group-hover:scale-110">📦</span>
                        </div>
                        <div className="mt-2 bg-white px-6 py-2 rounded-2xl shadow-xl border-b-4 border-slate-200 text-sm font-black text-slate-700 uppercase tracking-tighter">
                          {cat.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {config.mode === 'cooking' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-10">
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <span className="bg-slate-800 text-white px-6 py-2 rounded-full font-black text-xl mb-2">เมนู: {COOKING_RECIPES[dishIndex]?.name}</span>
                    {showCookingOrder && (
                      <div className="flex gap-4 p-4 bg-white rounded-3xl shadow-2xl border-4 border-blue-400 animate-in zoom-in">
                        {currentOrder.map((ing, i) => <div key={i} className="text-5xl">{ing}</div>)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center mt-20">
                    <div className="flex gap-4 mb-20 bg-slate-100 p-8 rounded-[40px] shadow-inner min-h-[140px] items-center">
                      {collectedIngredients.map((ing, i) => <div key={i} className="text-6xl animate-in bounce-in">{ing}</div>)}
                      {collectedIngredients.length < currentOrder.length && !showCookingOrder && (
                        <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-300 flex items-center justify-center text-slate-300 text-3xl font-black">?</div>
                      )}
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
                      {cookingItems.map((ing, i) => (
                        <button key={i} onClick={() => handleCookIngredient(ing)} className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-4xl hover:scale-110 active:scale-90 border-b-4 border-slate-200">{ing}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {config.mode === 'maze' && (
                <div className={`w-full h-full flex flex-col items-center justify-center p-6 transition-opacity duration-1000 ${isMazeHidden ? 'opacity-0' : 'opacity-100'}`}>
                  <div className="bg-slate-800 p-4 rounded-[40px] shadow-2xl border-8 border-slate-700">
                    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${maze[0]?.length || 0}, minmax(0, 1fr))` }}>
                      {maze.map((row, r) => row.map((cell, c) => (
                        <div key={`${r}-${c}`} className={`w-8 h-8 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-2xl ${cell === 1 ? 'bg-slate-700' : 'bg-slate-900/40'}`}>
                          {playerPos.r === r && playerPos.c === c && <span className="animate-pulse">🧍</span>}
                          {cell === 2 && <span className={`animate-bounce ${levelParam >= 7 && !hasKey ? 'grayscale opacity-30 brightness-50' : ''}`}>🏁</span>}
                          {cell === 3 && <span>🔑</span>}
                          {cell === 4 && showBombs && <span>💣</span>}
                        </div>
                      )))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-8">
                    <div /><button onClick={() => handleMazeMove(-1, 0)} className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center text-3xl border-b-8 border-slate-200">🔼</button><div />
                    <button onClick={() => handleMazeMove(0, -1)} className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center text-3xl border-b-8 border-slate-200">◀️</button>
                    <button onClick={() => handleMazeMove(1, 0)} className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center text-3xl border-b-8 border-slate-200">🔽</button>
                    <button onClick={() => handleMazeMove(0, 1)} className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center text-3xl border-b-8 border-slate-200">▶️</button>
                  </div>
                </div>
              )}

              {config.mode === 'matching' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-10">
                  <div className="grid grid-cols-2 gap-x-12 md:gap-x-20 gap-y-4 w-full max-w-3xl">
                    <div className="flex flex-col gap-3">
                      <span className="text-center font-black text-slate-400 text-xs mb-2 uppercase tracking-widest">วลี/คำพูด</span>
                      {matchingPairs.map((pair) => (
                        <button key={pair.id} onClick={() => handleMatchClick('left', pair.id)} disabled={pair.matched} className={`p-4 rounded-3xl shadow-md font-black text-sm md:text-lg transition-all ${pair.matched ? 'bg-green-50 text-green-300 opacity-40' : selectedLeft === pair.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}>
                          {pair.left}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col gap-3">
                      <span className="text-center font-black text-slate-400 text-xs mb-2 uppercase tracking-widest">หมวดหมู่</span>
                      {shuffledRight.map((item, idx) => {
                        const isMatched = matchingPairs.find(p => p.id === item.id)?.matched
                        return (<button key={idx} onClick={() => handleMatchClick('right', item.id)} disabled={isMatched} className={`p-4 rounded-3xl shadow-md font-black text-sm md:text-lg transition-all ${isMatched ? 'opacity-20' : 'bg-white text-slate-600 border-2 border-dashed'}`}>{item.text}</button>)
                      })}
                    </div>
                  </div>
                  <p className="mt-12 text-blue-400 font-bold italic animate-pulse">💡 เลือกวลีทางซ้าย แล้วเลือกหมวดหมู่ที่ถูกต้องทางขวา</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style jsx global>{`
        @keyframes jiggle { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
        .animate-jiggle { animation: jiggle 2s ease-in-out infinite; }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
      `}</style>
    </div>
  )
}

export default function ManagementPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-16 h-16 border-8 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div></div>}>
      <ManagementGameInner />
    </Suspense>
  )
}
