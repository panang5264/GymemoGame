'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ClockIntro from '@/components/ClockIntro'
import { getDateKey } from '@/lib/dailyChallenge'
import { useLevelSystem } from '@/hooks/useLevelSystem'
import { useProgress } from '@/contexts/ProgressContext'
import MemoryRecallChallenge from '@/components/MemoryRecallChallenge'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Item {
  id: string
  label: string
  emoji: string
  imageUrl?: string // New
  tags: string[]
  createdAt?: number
  x?: number
  y?: number
}

interface Category {
  id: string
  title: string
  emoji: string
  imageUrl?: string // New
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
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 55,
  }
}

// ─── Level Definitions ───────────────────────────────────────────────────────

interface CookingRecipe {
  name: string
  ingredients: string[]
  extra: string
  thought: string
  round: number
}

const COOKING_RECIPES: CookingRecipe[] = [
  // Round 1
  {
    name: 'กะเพราหมูสับ',
    ingredients: ['กระเทียม', 'พริกแดง', 'หมูสับ', 'กะเพรา', 'น้ำปลา', 'น้ำตาล'],
    extra: 'พริกแดง',
    thought: 'อยากได้ความเผ็ดเพิ่มจัง... (ใส่พริกแดงเพิ่ม)',
    round: 1
  },
  {
    name: 'ผัดไทยกุ้ง',
    ingredients: ['เต้าหู้', 'กุ้ง', 'เส้นจันท์', 'ถั่วงอก', 'กุยช่าย', 'น้ำปลา', 'น้ำตาล'],
    extra: 'น้ำปลา',
    thought: 'อยากได้ความเค็มเพิ่มจัง... (ใส่น้ำปลาเพิ่ม)',
    round: 1
  },
  {
    name: 'แตงกวาผัดไข่',
    ingredients: ['กระเทียม', 'แตงกวา', 'ไข่ไก่', 'น้ำปลา', 'น้ำตาล'],
    extra: 'น้ำตาล',
    thought: 'อยากได้ความหวานเพิ่มจัง... (ใส่น้ำตาลเพิ่ม)',
    round: 1
  },
  // Round 2
  {
    name: 'หมูสับทอดกระเทียม',
    ingredients: ['หมูสับ', 'กระเทียม', 'น้ำปลา', 'น้ำตาล'],
    extra: 'กระเทียม',
    thought: 'อยากได้ความหอมกระเทียมเพิ่มจัง... (ใส่กระเทียมเพิ่ม)',
    round: 2
  },
  {
    name: 'ไข่เจียวหมูสับ',
    ingredients: ['ไข่ไก่', 'หมูสับ', 'น้ำปลา'],
    extra: 'น้ำปลา',
    thought: 'อยากได้ความเค็มเพิ่มจัง... (ใส่น้ำปลาเพิ่ม)',
    round: 2
  },
  {
    name: 'ต้มยำกุ้ง',
    ingredients: ['กุ้ง', 'พริกแดง', 'น้ำปลา', 'น้ำตาล'],
    extra: 'พริกแดง',
    thought: 'อยากได้ความเผ็ดร้อนเพิ่มจัง... (ใส่พริกแดงเพิ่ม)',
    round: 2
  },
  // Round 3
  {
    name: 'ข้าวผัดกุ้ง',
    ingredients: ['ข้าวสวย', 'ไข่ไก่', 'กุ้ง', 'แตงกวา', 'น้ำปลา', 'น้ำตาล'],
    extra: 'น้ำตาล',
    thought: 'อยากได้ความกลมกล่อมเพิ่มจัง... (ใส่น้ำตาลเพิ่ม)',
    round: 3
  },
  {
    name: 'ส้มตำ',
    ingredients: ['กระเทียม', 'พริกแดง', 'น้ำตาล', 'น้ำปลา'],
    extra: 'น้ำปลา',
    thought: 'อยากได้ความนัวเพิ่มจัง... (ใส่น้ำปลาเพิ่ม)',
    round: 3
  }
]

const ROUND_INGREDIENTS_LIST: Record<number, string[]> = {
  1: ['กระเทียม', 'กะเพรา', 'กุยช่าย', 'กุ้ง', 'ข้าวสวย', 'ถั่วงอก', 'น้ำตาล', 'น้ำปลา', 'พริกแดง', 'หมูสับ', 'เต้าหู้', 'เส้นจันท์', 'แตงกวา', 'ไข่ไก่'],
  2: ['กระเทียม', 'กุ้ง', 'น้ำตาล', 'น้ำปลา', 'พริกแดง', 'หมูสับ', 'ไข่ไก่'],
  3: ['กระเทียม', 'กุ้ง', 'ข้าวสวย', 'น้ำตาล', 'น้ำปลา', 'พริกแดง', 'แตงกวา', 'ไข่ไก่'],
  4: ['กระเทียม', 'กุ้ง', 'น้ำตาล', 'น้ำปลา', 'พริกแดง', 'หมูสับ', 'ไข่ไก่'] // Fallback for Round 4
}

function getIngPath(name: string, round: number) {
  const ext = name === 'ข้าวสวย' ? 'jpg' : 'png'
  return `/Asset ด้าน/บริหารจัดการ/หมู่บ้านที่ 4/รอบที่ ${round}/วัตถุดิบ/${name}.${ext}`
}

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
    while (bombAttempts < 200) { // Increased attempts for higher reliability
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

// ─── Asset Paths ─────────────────────────────────────────────────────────────
const MG_BASE = '/Asset ด้าน/บริหารจัดการ'
const MAZE_ASSETS_BASE = `${MG_BASE}/เกมเขาวงกต หมู่บ้านที่ 6-7-8-9/ICON อื่นๆ`

const MAZE_ICONS = {
  key: `${MAZE_ASSETS_BASE}/กุญแจ.png`,
  bomb: `${MAZE_ASSETS_BASE}/ลูกระเบิด.png`,
  lock: `${MAZE_ASSETS_BASE}/แม่กุญแจ.png`
}

// V1 Images were poorly cropped, replaced with V2 assets for clearer gameplay

// Village 1 assets – Red & Round
// Village 1 assets – Red & Round
const V1_RED = [
  { id: 'r1', label: 'รถดับเพลิง', emoji: '🚒', tags: ['red'], imageUrl: `${MG_BASE}/หมู่บ้านที่ 1/รอบที่ 1/หมวดหมู่ที่1/หมวดสีแดง/รถดับเพลิง.jpg` },
  { id: 'r2', label: 'ป้ายหยุด', emoji: '🛑', tags: ['red'], imageUrl: `${MG_BASE}/หมู่บ้านที่ 1/รอบที่ 1/หมวดหมู่ที่1/หมวดสีแดง/ป้ายหยุด.jpg` },
  { id: 'r3', label: 'ตู้ไปรษณีย์', emoji: '📮', tags: ['red'], imageUrl: `${MG_BASE}/หมู่บ้านที่ 1/รอบที่ 1/หมวดหมู่ที่1/หมวดสีแดง/ตู้ไปรษณีย์.jpg` },
  { id: 'r4', label: 'พริก', emoji: '�️', tags: ['red'], imageUrl: `${MG_BASE}/หมู่บ้านที่ 1/รอบที่ 1/หมวดหมู่ที่1/หมวดสีแดง/พริก.jpg` },
  { id: 'r5', label: 'ดอกกุหลาบ', emoji: '🌹', tags: ['red'], imageUrl: `${MG_BASE}/หมู่บ้านที่ 1/รอบที่ 1/หมวดหมู่ที่1/หมวดสีแดง/ดอกกุหลาบ.jpg` },
]
const V1_ROUND = [
  { id: 'ro1', label: 'ลูกบาสเกตบอล', emoji: '🏀', tags: ['round'], imageUrl: `${MG_BASE}/หมู่บ้านที่ 1/รอบที่ 1/หมวดหมู่ที่2/ทรงกลม/ลูกบาสเกตบอล.jpg` },
  { id: 'ro2', label: 'โลก', emoji: '�', tags: ['round'], imageUrl: `${MG_BASE}/หมู่บ้านที่ 1/รอบที่ 1/หมวดหมู่ที่2/ทรงกลม/โลก.jpg` },
  { id: 'ro3', label: 'ดวงจันทร์', emoji: '🌕', tags: ['round'], imageUrl: `${MG_BASE}/หมู่บ้านที่ 1/รอบที่ 1/หมวดหมู่ที่2/ทรงกลม/ดวงะจันทร์.jpg` },
  { id: 'ro4', label: 'ดาวศุกร์', emoji: '🌑', tags: ['round'], imageUrl: `${MG_BASE}/หมู่บ้านที่ 1/รอบที่ 1/หมวดหมู่ที่2/ทรงกลม/ดาวศุกร์.jpg` },
  { id: 'ro5', label: 'ดาวอังคาร', emoji: '�', tags: ['round'], imageUrl: `${MG_BASE}/หมู่บ้านที่ 1/รอบที่ 1/หมวดหมู่ที่2/ทรงกลม/ดาวอังคาร.jpg` },
]

// Village 2 images – 4-legged animals & Scrubbers
const V2_ANIMALS = [
  { id: 'a1', label: 'จระเข้', emoji: '🐊', tags: ['animal4'], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 3/จรเข้.png` },
  { id: 'a2', label: 'ช้าง', emoji: '🐘', tags: ['animal4'], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 3/ช้าง.png` },
  { id: 'a3', label: 'ม้าลาย', emoji: '🦓', tags: ['animal4'], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 3/ม้าลาย.png` },
  { id: 'a4', label: 'ยีราฟ', emoji: '🦒', tags: ['animal4'], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 3/ยีราฟ.png` },
  { id: 'a5', label: 'หมู', emoji: '🐷', tags: ['animal4'], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 3/หมู.png` },
]
const V2_SCRUBBERS = [
  { id: 'sc1', label: 'ฝอยขัดหม้อ', emoji: '🧽', tags: ['scrubber'], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 4/ฝอยขัดหม้อ.png` },
  { id: 'sc2', label: 'ฟองน้ำ', emoji: '🧽', tags: ['scrubber'], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 4/ฟองน้ำ.png` },
  { id: 'sc3', label: 'แปรงขัดส้วม', emoji: '🧹', tags: ['scrubber'], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 4/แปรงขัดส้วม.png` },
  { id: 'sc4', label: 'แปรงสีฟัน', emoji: '🪥', tags: ['scrubber'], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 4/แปรงสีฟัน.png` },
  { id: 'sc5', label: 'ไม้ถู', emoji: '🧹', tags: ['scrubber'], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 4/ไม้ถู.png` },
]
const DISTRACTORS = [
  { id: 'd1', label: 'กล้วย', emoji: '�', tags: [], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 5/กล้วย.png` },
  { id: 'd2', label: 'กางเกง', emoji: '👖', tags: [], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 5/กางเกง.png` },
  { id: 'd3', label: 'กีตาร์', emoji: '�', tags: [], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 5/กีตาร์.png` },
  { id: 'd4', label: 'กุญแจ', emoji: '🔑', tags: [], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 5/กุญแจ.png` },
  { id: 'd5', label: 'งู', emoji: '�', tags: [], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 5/งู.png` },
  { id: 'd6', label: 'นกแก้ว', emoji: '🦜', tags: [], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 5/นกแก้ว.png` },
  { id: 'd7', label: 'ร่ม', emoji: '☂️', tags: [], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 5/ร่ม.png` },
  { id: 'd8', label: 'สมุด', emoji: '📖', tags: [], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 5/สมุด.png` },
  { id: 'd9', label: 'เครื่องบิน', emoji: '✈️', tags: [], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 5/เครื่องบิน.png` },
  { id: 'd10', label: 'แว่นตา', emoji: '👓', tags: [], imageUrl: `${MG_BASE}/หมวดหมู่ที่ 5/แว่นตา.png` },
]

function getLevelConfig(level: number) {
  let mode: GameMode = 'sorting'
  let items: Item[] = []
  let categories: Category[] = []
  let instruction = 'ทำภารกิจให้สำเร็จตามที่กำหนด'

  switch (level) {
    case 1:
      instruction = 'แยกวัตถุสีแดง และ วัตถุรูปทรงกลม (15 ชิ้น)'
      categories = [
        { id: 'red', title: 'วัตถุสีแดง 🔴', emoji: '📦', accepts: i => i.tags.includes('red') },
        { id: 'round', title: 'วัตถุทรงกลม ⚪', emoji: '📦', accepts: i => i.tags.includes('round') },
      ]
      items = [...V1_RED, ...V1_ROUND, ...DISTRACTORS.slice(0, 5)]
      break

    case 2:
      instruction = 'แยกสัตว์ 4 ขา และ อุปกรณ์สำหรับขัด/แปรง (15 ชิ้น)'
      categories = [
        { id: 'animal4', title: 'สัตว์ 4 ขา 🐾', emoji: '🕳️', accepts: i => i.tags.includes('animal4') },
        { id: 'scrubber', title: 'อุปกรณ์ขัด/แปรง 🧽', emoji: '🕳️', accepts: i => i.tags.includes('scrubber') },
      ]
      items = [...V2_ANIMALS, ...V2_SCRUBBERS, ...DISTRACTORS.slice(0, 5)]
      break

    case 3:
      instruction = 'แยก 4 หมวดหมู่! ภาชนะจะสลับทุก 2 ครั้ง (30 ชิ้น)'
      // Prompt Requirement: Hole 1: 4-legged animals, Hole 2: Cleaning tools, Box 1: Red... Box 2: Round...
      // Start with the "Holes" set
      categories = [
        { id: 'animal4', title: 'หลุม 1: สัตว์ 4 ขา 🐾', emoji: '🕳️', accepts: i => i.tags.includes('animal4') },
        { id: 'scrubber', title: 'หลุม 2: อุปกรณ์ขัด/แปรง 🧽', emoji: '🕳️', accepts: i => i.tags.includes('scrubber') },
      ]
      items = [...V2_ANIMALS, ...V2_SCRUBBERS, ...V1_RED, ...V1_ROUND, ...DISTRACTORS.slice(0, 10)]
      break

    case 4:
    case 5:
      mode = 'cooking'
      instruction = level === 4 ? 'ปรุงอาหารตามลำดับที่ปรากฏ (จำลำดับให้ดี!)' : 'ปรุงอาหารและปรับรสชาติพิเศษตามความคิดของตัวละคร'
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
  const isBonus = searchParams.get('isBonus') === '1'

  // Phase State
  const [phase, setPhase] = useState<'intro' | 'memorize' | 'clock' | 'recall' | 'play' | 'done'>('intro')
  const [memoryWords, setMemoryWords] = useState<string[]>([])
  const [clockTarget] = useState(() => ({
    h: Math.floor(Math.random() * 12) + 1,
    m: [0, 15, 30, 45][Math.floor(Math.random() * 4)]
  }))
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong', message: string } | null>(null)

  // Context Hooks
  const { progress, saveProgress } = useProgress()
  const { recordPlay } = useLevelSystem()

  // Sorting State
  const [config, setConfig] = useState(() => getLevelConfig(levelParam))
  const [spawnQueue, setSpawnQueue] = useState<Item[]>([])
  const [activePool, setActivePool] = useState<Item[]>([])
  const [correctCount, setCorrectCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [startTime] = useState(Date.now())
  const [playedRounds, setPlayedRounds] = useState(1)
  const [selectedSortItemId, setSelectedSortItemId] = useState<string | null>(null)
  const [accumulatedScore, setAccumulatedScore] = useState(0)

  // Cooking State
  const [dishIndex, setDishIndex] = useState(0)
  const [showCookingOrder, setShowCookingOrder] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<string[]>([])
  const [collectedIngredients, setCollectedIngredients] = useState<string[]>([])
  const [cookingItems, setCookingItems] = useState<{ name: string, image: string }[]>([])
  const [isExtraPhase, setIsExtraPhase] = useState(false)
  const [thoughtBubble, setThoughtBubble] = useState<string | null>(null)
  const [shuffledRecipes, setShuffledRecipes] = useState<CookingRecipe[]>([])
  const [hintsUsed, setHintsUsed] = useState(0)

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

  // Persistence Guard
  const hasSavedRef = useRef(false)

  // Refs for tracking states safely inside intervals
  const activePoolRef = useRef(activePool)
  useEffect(() => { activePoolRef.current = activePool }, [activePool])
  const spawnQueueRef = useRef(spawnQueue)
  useEffect(() => { spawnQueueRef.current = spawnQueue }, [spawnQueue])

  // Initialization
  useEffect(() => {
    hasSavedRef.current = false
    const c = getLevelConfig(levelParam)
    setConfig(c)
    setSpawnQueue(c.items)

    if (c.mode === 'maze') {
      const rows = 9 + (levelParam > 7 ? 2 : 0) + Math.floor(Math.random() * 2)
      const cols = 9 + (levelParam > 7 ? 2 : 0) + Math.floor(Math.random() * 2)
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
      let rounds = [1]
      if (villageId === 4) rounds = [1, 3]
      else if (villageId === 5) rounds = [2, 4]
      else rounds = [1, 2, 3]

      const recipes = COOKING_RECIPES.filter(r => rounds.includes(r.round)).sort(() => Math.random() - 0.5)
      setShuffledRecipes(recipes)
      setDishIndex(0)
      startNewCookingDish(0, recipes)
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
      const currentQueue = spawnQueueRef.current
      const currentPool = activePoolRef.current

      if (currentPool.length < MAX_ACTIVE_ITEMS && currentQueue.length > 0) {
        const nextItem = currentQueue[0]
        const { x, y } = getRandomPos()
        const newItem = { ...nextItem, createdAt: Date.now(), x, y }

        setActivePool([...currentPool, newItem])
        setSpawnQueue(currentQueue.slice(1))
      }
    }, 1500)

    return () => clearInterval(interval)
  }, [phase, config.mode])

  // Expiration & Fade Logic
  useEffect(() => {
    if (phase !== 'play') return

    const interval = setInterval(() => {
      const now = Date.now()

      // Sorting cleanup: items expire and disappear
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
          // Prompt: "Only two containers (either the two holes OR the two boxes) are visible at a time. The visible set swaps every two correct sorts."
          const isHoleSet = config.categories.some(c => c.emoji === '🕳️')
          const newCategories: Category[] = isHoleSet
            ? [
              { id: 'red', title: 'กล่อง 1: วัตถุสีแดง 🔴', emoji: '📦', accepts: i => i.tags.includes('red') },
              { id: 'round', title: 'กล่อง 2: วัตถุทรงกลม ⚪', emoji: '📦', accepts: i => i.tags.includes('round') },
            ]
            : [
              { id: 'animal4', title: 'หลุม 1: สัตว์ 4 ขา 🐾', emoji: '🕳️', accepts: i => i.tags.includes('animal4') },
              { id: 'scrubber', title: 'หลุม 2: อุปกรณ์ขัด/แปรง 🧽', emoji: '🕳️', accepts: i => i.tags.includes('scrubber') },
            ]

          setConfig(prevCfg => ({ ...prevCfg, categories: newCategories }))
          setFeedback({ type: 'correct', message: '🔄 สับเปลี่ยนภาชนะ!' })
        }
        return newCount
      })
    } else {
      // Level 1: -1 for wrong category. Level 2+: 0 (no penalty mentioned for L2/L3)
      const penalty = levelParam === 1 ? -1 : 0
      setScore(s => s + penalty)
      setErrorCount(e => e + 1)
      setFeedback({ type: 'wrong', message: levelParam === 1 ? '❌ ผิดหมวด! (-1)' : '❌ ผิดหมวด!' })
    }
    setActivePool(prev => prev.filter(i => i.id !== itemId))
    setTimeout(() => setFeedback(null), 1000)
  }

  // Cooking Handlers
  const startNewCookingDish = (idx: number, recipesToUse = shuffledRecipes) => {
    if (idx >= recipesToUse.length) {
      setPhase('done')
      return
    }
    const recipe = recipesToUse[idx]
    setCurrentOrder(recipe.ingredients)
    setCollectedIngredients([])
    setShowCookingOrder(true)
    setIsExtraPhase(false)
    setThoughtBubble(null)
    setFeedback(null)
    setHintsUsed(0)

    // Pool of ingredients for THIS round, filtered to be easier (dish ingredients + 3 distractors)
    const roundIngs = ROUND_INGREDIENTS_LIST[recipe.round] || ROUND_INGREDIENTS_LIST[1]
    const distractors = roundIngs.filter(ing => !recipe.ingredients.includes(ing)).sort(() => Math.random() - 0.5).slice(0, 3)

    const items = [...recipe.ingredients, ...distractors].map(name => ({
      name,
      image: getIngPath(name, recipe.round)
    })).sort(() => Math.random() - 0.5)

    setCookingItems(items)
    setTimeout(() => setShowCookingOrder(false), 7000)
  }

  const handleCookIngredient = (ing: string) => {
    if (isExtraPhase) {
      const recipe = shuffledRecipes[dishIndex]
      if (recipe.extra === ing) {
        setScore(s => s + 5)
        setFeedback({ type: 'correct', message: '✨ รสชาติเลิศมาก!' })
        setTimeout(() => {
          setDishIndex(d => d + 1)
          startNewCookingDish(dishIndex + 1)
        }, 1000)
      } else {
        setFeedback({ type: 'wrong', message: '❌ รสชาตินี้ยังไม่ใช่...' })
        setTimeout(() => setFeedback(null), 1000)
      }
      return
    }

    const isCorrect = currentOrder[collectedIngredients.length] === ing
    if (isCorrect) {
      const next = [...collectedIngredients, ing]
      setCollectedIngredients(next)
      if (next.length === currentOrder.length) {
        if (levelParam === 5) {
          setIsExtraPhase(true)
          setThoughtBubble(shuffledRecipes[dishIndex].thought)
          setFeedback({ type: 'correct', message: '🥣 ปรุงเสร็จแล้ว... เอ๊ะ?' })
        } else {
          setScore(s => s + 5)
          setFeedback({ type: 'correct', message: '🍽️ ปรุงเสร็จแล้ว!' })
          setTimeout(() => {
            setDishIndex(d => d + 1)
            startNewCookingDish(dishIndex + 1)
          }, 1000)
        }
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

  // Navigation and Saving
  const handleNext = (path: string) => {
    if (hasSavedRef.current) {
      router.push(path)
      return
    }
    hasSavedRef.current = true

    const finalAverage = Math.round((accumulatedScore + score) / playedRounds)
    const accuracy = (correctCount + errorCount) > 0 ? (correctCount / (correctCount + errorCount)) * 100 : 100
    const timeTaken = (Date.now() - startTime) / 1000

    const scoreMultiplier = isBonus ? 2 : 1

    // Scaling target: VillageId * 100
    // Target Raw: Cooking=15, Sorting=10, Matching=10, Maze=20
    let targetRaw = 10
    if (config.mode === 'cooking') targetRaw = 15
    if (config.mode === 'maze') targetRaw = 20
    if (config.mode === 'matching') targetRaw = 10

    const scaledScore = Math.floor(((finalAverage * scoreMultiplier) / targetRaw) * (villageId * 100))
    const finalVillageScore = Math.max(0, scaledScore)

    if (modeParam === 'village') recordPlay(villageId, finalVillageScore, 'management', subId, accuracy, timeTaken)
    else if (modeParam === 'daily') {
      const dk = getDateKey()

      if (progress) {
        import('@/lib/levelSystem').then(({ saveDailyScore: rawSaveDailyScore, markDailyMode: rawMarkDailyMode }) => {
          let nextP = { ...progress }
          nextP = rawSaveDailyScore(nextP, dk, 'management', finalAverage)
          nextP = rawMarkDailyMode(nextP, dk, 'management')
          saveProgress(nextP)
        })
      }

      if (progress?.guestId) {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
        fetch(`${API_BASE_URL}/api/analysis/record`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestId: progress.guestId,
            gameType: 'management',
            level: 0, // Daily level 0
            subLevelId: 0,
            score: finalAverage,
            accuracy,
            timeTaken
          })
        }).catch(err => console.error('Failed to log daily analytics:', err))
      }
    }

    router.push(path)
  }

  const handleReplay = () => {
    setAccumulatedScore(prev => prev + score)
    setPlayedRounds(r => r + 1)

    // reset scores and trackers
    setScore(0)
    setCorrectCount(0)
    setErrorCount(0)
    setPhase('intro')
    hasSavedRef.current = false

    // reset config
    const c = getLevelConfig(levelParam)
    setConfig(c)
    setSpawnQueue(c.items)
    setActivePool([])

    if (c.mode === 'maze') {
      const rows = 9 + (levelParam > 7 ? 2 : 0)
      const cols = 9 + (levelParam > 7 ? 2 : 0)
      const needsKey = levelParam >= 7
      const needsBombs = levelParam >= 8
      const mazeLayout = generateMaze(rows, cols, needsKey, needsBombs)
      setMaze(mazeLayout)
      setPlayerPos({ r: 1, c: 1 })
      setHasKey(false)
      setShowBombs(needsBombs)
      setLastMoveTime(Date.now())
    }

    if (c.mode === 'cooking') {
      let rounds = [1]
      if (villageId === 4) rounds = [1, 3]
      else if (villageId === 5) rounds = [2, 4]
      else rounds = [1, 2, 3]

      const recipes = COOKING_RECIPES.filter(r => rounds.includes(r.round)).sort(() => Math.random() - 0.5)
      setShuffledRecipes(recipes)
      setDishIndex(0)
      startNewCookingDish(0, recipes)
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
  }

  // ─── Render Components ──────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center justify-center p-2 md:p-6 selection:bg-indigo-100 min-h-screen w-full font-['Supermarket'] bg-slate-100/50">
      <div className="w-full max-w-7xl bg-white rounded-[32px] md:rounded-[48px] shadow-2xl overflow-hidden flex flex-col h-[calc(100vh-40px)] md:h-[calc(100vh-80px)] min-h-[550px] relative border border-slate-100">

        {/* Header Bar */}
        <div className="h-16 md:h-20 bg-white border-b-2 border-slate-50 flex items-center justify-between px-4 md:px-10 shrink-0">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 rounded-lg md:rounded-2xl flex items-center justify-center text-xl md:text-3xl relative">
              {levelParam <= 3 ? '📦' : levelParam <= 5 ? '🍳' : levelParam <= 9 ? '🧭' : '📝'}
              {isBonus && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[8px] md:text-[10px] font-black px-1.5 py-0.5 rounded-full border border-yellow-500 shadow-sm animate-pulse">
                  x2
                </div>
              )}
            </div>
            <h1 className="text-sm md:text-2xl font-black text-slate-800 tracking-tight leading-tight max-w-[150px] md:max-w-none">
              {config.instruction}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</span>
              <span className="text-2xl md:text-4xl font-black text-indigo-600 tabular-nums">{score}</span>
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
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-sm p-4 md:p-10">
              <div className="max-w-md w-full bg-white rounded-3xl md:rounded-[40px] p-8 md:p-10 shadow-2xl border border-slate-100 text-center animate-in zoom-in">
                <div className="text-7xl md:text-9xl mb-6 md:mb-8 animate-bounce">
                  {levelParam <= 3 ? '📦' : levelParam <= 5 ? '🍳' : levelParam <= 9 ? '🧭' : '📝'}
                </div>
                {modeParam === 'daily' ? (
                  <>
                    <h3 className="text-2xl md:text-3xl font-black text-orange-500 mb-2 uppercase tracking-tighter">🌟 ภารกิจรายวัน</h3>
                    <p className="text-slate-600 font-bold mb-8 md:mb-10 text-sm md:text-lg bg-orange-50 py-2 border-2 border-orange-200 rounded-full">ด่านที่ 1/3: โหมดการจัดการ</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-2 md:mb-4 uppercase tracking-tighter">Level {levelParam}</h3>
                    <p className="text-slate-500 font-bold mb-8 md:mb-12 text-sm md:text-lg">{config.instruction}</p>
                  </>
                )}
                <button
                  onClick={() => setPhase('play')}
                  className={`w-full py-5 text-white rounded-[24px] font-black text-2xl shadow-xl hover:scale-105 transition-all active:scale-95 ${modeParam === 'daily' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-slate-800'}`}
                >
                  {modeParam === 'daily' ? 'เริ่มภารกิจ! 🚀' : 'เริ่มเล่น 🚀'}
                </button>
              </div>
            </div>
          )}

          {phase === 'done' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-md p-4 md:p-6">
              <div className="max-w-[400px] w-full bg-white rounded-3xl md:rounded-[48px] p-8 md:p-12 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] border border-white text-center animate-in zoom-in">
                <div className="relative mb-4 flex justify-center">
                  <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 animate-pulse" />
                  <div className="text-6xl md:text-8xl relative drop-shadow-2xl">🎯</div>
                </div>
                <h3 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight">
                  คะแนนรอบนี้: {score}
                </h3>
                {playedRounds > 1 && (
                  <p className="text-xl md:text-3xl font-black text-indigo-600 mb-2 mt-4">
                    คะแนนเฉลี่ย ({playedRounds} รอบ): {Math.round((accumulatedScore + score) / playedRounds)}
                  </p>
                )}
                <p className="text-slate-400 font-bold mt-4 mb-8 uppercase tracking-[0.2em] text-[10px]">เลเวล {levelParam}</p>
                <div className="flex flex-col gap-3">
                  {playedRounds < 3 && (
                    <button
                      onClick={handleReplay}
                      className="w-full py-4 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-[24px] font-black text-xl shadow-md transition-all active:scale-95 border-2 border-sky-300"
                    >
                      เล่นซ้ำ (รอบที่ {playedRounds}/3) 🔄
                    </button>
                  )}
                  {modeParam === 'village' ? (
                    <>
                      {subId < 12 ? (
                        <button
                          onClick={() => handleNext(`/world/${villageId}/sublevel/${subId + 1}`)}
                          className="w-full py-5 bg-green-500 hover:bg-green-600 text-white rounded-[24px] font-black text-2xl shadow-xl transition-all active:scale-95"
                        >
                          ด่านต่อไป 🚀
                        </button>
                      ) : villageId < 10 ? (
                        <button
                          onClick={() => handleNext(`/world/${villageId + 1}`)}
                          className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white rounded-[24px] font-black text-2xl shadow-xl transition-all active:scale-95"
                        >
                          หมู่บ้านต่อไป 🏘️
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleNext(`/world/${villageId}?showSummary=1`)}
                        className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[24px] font-black text-lg transition-all"
                      >
                        กลับสู่แผนที่ 🗺️
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleNext(modeParam === 'daily' ? '/daily-challenge' : '/world')}
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
                        onClick={() => setSelectedSortItemId(prev => prev === item.id ? null : item.id)}
                        className={`absolute w-28 h-28 md:w-40 md:h-40 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing z-10 select-none animate-in fade-in zoom-in transition-all duration-300 ${selectedSortItemId === item.id ? 'scale-110 -translate-y-4 filter drop-shadow-[0_0_20px_rgba(79,70,229,0.5)]' : ''}`}
                        style={{ left: `${item.x}%`, top: `${item.y}%`, transform: 'translate(-50%, -50%)' }}
                      >
                        <div className={`transition-all duration-300 transform ${selectedSortItemId === item.id ? 'scale-110' : 'group-hover:-translate-y-2'}`}>
                          {item.imageUrl ? (
                            <div className={`w-24 h-24 md:w-36 md:h-36 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 overflow-hidden pointer-events-none transition-colors ${selectedSortItemId === item.id ? 'border-indigo-500' : 'border-indigo-100'}`}>
                              <img
                                src={item.imageUrl}
                                className="w-[85%] h-[85%] object-cover mix-blend-multiply"
                                style={{ filter: 'contrast(1.1) brightness(1.05) saturate(1.1)', imageRendering: 'crisp-edges' }}
                                alt={item.label}
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 md:w-36 md:h-36 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-indigo-100 pointer-events-none">
                              <span className="text-6xl md:text-8xl drop-shadow-lg">{item.emoji}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 bg-white px-3 py-1 md:px-5 md:py-2 rounded-full shadow-md text-sm md:text-xl font-black text-indigo-900 border-2 border-slate-100 tracking-wide text-center">
                          {item.label}
                        </div>
                        <div className="absolute -bottom-4 left-4 right-4 h-2.5 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
                          <div className="h-full bg-pink-500 transition-all linear" style={{ width: `${Math.max(0, 100 - ((Date.now() - (item.createdAt || 0)) / ITEM_LIFETIME * 100))}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="h-44 w-full flex justify-center gap-12 md:gap-24 px-10 pb-8">
                    {config.categories.map(cat => (
                      <div
                        key={cat.id}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          handleSortItem(e.dataTransfer.getData('itemId'), cat.id);
                          setSelectedSortItemId(null);
                        }}
                        onClick={() => {
                          if (selectedSortItemId) {
                            handleSortItem(selectedSortItemId, cat.id);
                            setSelectedSortItemId(null);
                          }
                        }}
                        className={`flex flex-col items-center group cursor-pointer transition-all ${selectedSortItemId ? 'animate-bounce-gentle' : ''}`}
                      >
                        <div className={`w-28 h-16 md:w-40 md:h-28 bg-white rounded-[20px] md:rounded-[28px] border-4 border-dashed shadow-2xl flex items-center justify-center transition-all relative overflow-hidden ${selectedSortItemId ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-300 group-hover:border-blue-400'}`}>
                          {cat.imageUrl ? (
                            <img src={cat.imageUrl} className="w-full h-full object-cover" alt={cat.title} />
                          ) : (
                            <span className="text-5xl md:text-7xl drop-shadow-xl transition-transform duration-500 group-hover:scale-110">
                              {cat.emoji || '📦'}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 bg-white px-6 py-2 rounded-2xl shadow-xl border-b-4 border-slate-200 text-sm md:text-base font-black text-slate-800 uppercase tracking-tighter">
                          {cat.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {config.mode === 'cooking' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-10">
                  <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                    <span className="bg-amber-500 text-white px-6 py-2 rounded-full font-black text-sm md:text-xl mb-4 shadow-lg border-2 border-amber-300">
                      เมนู: {shuffledRecipes[dishIndex]?.name}
                    </span>

                    {showCookingOrder && (
                      <div className="flex flex-wrap justify-center gap-2 p-4 bg-white rounded-3xl shadow-2xl border-4 border-indigo-400 animate-in zoom-in max-w-lg relative">
                        <button
                          onClick={() => setShowCookingOrder(false)}
                          className="absolute -top-3 -right-3 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-600 transition-colors z-10"
                        >
                          ✕
                        </button>
                        {currentOrder.map((ing, i) => (
                          <div key={i} className="px-4 py-2 bg-indigo-50 rounded-2xl text-indigo-700 font-black text-sm md:text-xl border-2 border-indigo-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                            {ing}
                          </div>
                        ))}
                      </div>
                    )}

                    {!showCookingOrder && !isExtraPhase && hintsUsed < 2 && (
                      <button
                        onClick={() => {
                          setShowCookingOrder(true);
                          setHintsUsed(prev => prev + 1);
                          setTimeout(() => setShowCookingOrder(false), 3000);
                        }}
                        className="mt-2 px-6 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-full font-black text-sm md:text-base border-2 border-indigo-200 shadow-sm transition-all hover:scale-105 active:scale-95 flex flex-col items-center"
                      >
                        <div className="flex items-center gap-2">
                          💡 ดูสูตรอีกครั้ง
                        </div>
                        <span className="text-[10px] opacity-70">เหลืออีก {2 - hintsUsed} ครั้ง (โชว์ 3 วิ)</span>
                      </button>
                    )}

                    {thoughtBubble && (
                      <div className="relative p-6 bg-white rounded-[2rem] shadow-2xl border-4 border-rose-400 animate-in slide-in-from-top duration-500 max-w-md">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-l-4 border-t-4 border-rose-400 rotate-45"></div>
                        <p className="text-rose-600 font-black text-lg md:text-2xl text-center">
                          💭 "{thoughtBubble}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center mt-24 md:mt-32">
                    <div className="relative mb-12 md:mb-16">
                      <div className="w-72 h-32 md:w-[28rem] md:h-44 bg-slate-200/50 rounded-full border-b-[12px] border-slate-300 flex items-center justify-center relative overflow-hidden shadow-inner px-8">
                        <div className="flex flex-wrap justify-center gap-3 p-4">
                          {collectedIngredients.map((ing, i) => (
                            <div key={i} className="w-12 h-12 md:w-20 md:h-20 bg-white/80 rounded-2xl shadow-sm flex items-center justify-center p-1.5 animate-in bounce-in overflow-hidden relative group border-2 border-white">
                              <img src={getIngPath(ing, shuffledRecipes[dishIndex]?.round || 1)} className="w-[120%] h-[120%] max-w-none object-contain scale-125" alt={ing} />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-[10px] text-white font-bold">{ing}</span>
                              </div>
                            </div>
                          ))}
                          {collectedIngredients.length < currentOrder.length && !showCookingOrder && !isExtraPhase && (
                            <div className="text-slate-400 font-black text-4xl md:text-6xl animate-pulse">?</div>
                          )}
                        </div>
                      </div>
                      {/* Pan handle or decor */}
                      <div className="absolute top-1/2 -right-16 md:-right-24 w-20 md:w-32 h-4 md:h-6 bg-slate-400 rounded-full -translate-y-1/2 shadow-md"></div>
                    </div>

                    <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-4 max-w-4xl px-2 md:px-4">
                      {cookingItems.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => handleCookIngredient(item.name)}
                          className="group flex flex-col items-center gap-1.5 md:gap-3 p-1.5 md:p-3 bg-white rounded-2xl md:rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all border-b-[4px] md:border-b-[6px] border-slate-200"
                        >
                          <div className="w-full aspect-square bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center border-2 border-slate-100 overflow-hidden relative">
                            <img
                              src={item.image}
                              className="w-full h-full object-contain scale-[1.35] md:scale-[1.5] group-hover:scale-[1.5] md:group-hover:scale-[1.65] transition-transform"
                              alt={item.name}
                            />
                          </div>
                          <div className="px-2 md:px-5 py-1 md:py-1.5 bg-indigo-50 rounded-full border-2 border-indigo-100 text-indigo-800 font-extrabold text-[10px] sm:text-xs md:text-lg shadow-sm w-full text-center leading-tight">
                            {item.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {config.mode === 'maze' && (
                <div className={`w-full h-full flex flex-col items-center justify-center p-6 bg-white transition-all duration-1000 relative`}>
                  <div className="bg-white p-2 md:p-4 rounded-xl md:rounded-2xl shadow-2xl border-2 md:border-4 border-slate-800 transition-colors duration-500 overflow-hidden relative z-10">
                    <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${maze[0]?.length || 1}, minmax(0, 1fr))` }}>
                      {maze.map((row, r) => row.map((cell, c) => (
                        <div
                          key={`${r}-${c}`}
                          className={`w-7 h-7 md:w-10 md:h-10 flex items-center justify-center transition-all duration-300 ${cell === 1
                            ? 'bg-slate-900'
                            : 'bg-white'
                            }`}
                        >
                          {playerPos.r === r && playerPos.c === c && (
                            <div className="w-[85%] h-[85%] relative z-30 transition-all transform duration-200">
                              <img src="/assets_employer/logo.png" className="w-full h-full object-contain animate-bounce-gentle drop-shadow-md" alt="player" />
                            </div>
                          )}
                          {cell === 2 && (
                            <div className={`relative w-[85%] h-[85%] flex items-center justify-center z-20 ${levelParam >= 7 && !hasKey ? 'grayscale opacity-30 brightness-50' : 'animate-bounce'}`}>
                              <span className="text-2xl md:text-3xl drop-shadow-md">🚩</span>
                            </div>
                          )}
                          {cell === 3 && (
                            <img src={MAZE_ICONS.key} className="w-full h-full object-contain animate-jiggle p-1 z-20" alt="key" />
                          )}
                          {cell === 4 && showBombs && (
                            <img src={MAZE_ICONS.bomb} className="w-full h-full object-contain p-1 z-20" alt="bomb" />
                          )}
                        </div>
                      )))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-8 relative z-10">
                    <div />
                    <button onClick={() => handleMazeMove(-1, 0)} className="w-14 h-14 bg-slate-800 text-white rounded-2xl shadow-xl flex items-center justify-center text-2xl active:scale-90 transition-all">🔼</button>
                    <div />
                    <button onClick={() => handleMazeMove(0, -1)} className="w-14 h-14 bg-slate-800 text-white rounded-2xl shadow-xl flex items-center justify-center text-2xl active:scale-90 transition-all">◀️</button>
                    <button onClick={() => handleMazeMove(1, 0)} className="w-14 h-14 bg-slate-800 text-white rounded-2xl shadow-xl flex items-center justify-center text-2xl active:scale-90 transition-all">🔽</button>
                    <button onClick={() => handleMazeMove(0, 1)} className="w-14 h-14 bg-slate-800 text-white rounded-2xl shadow-xl flex items-center justify-center text-2xl active:scale-90 transition-all">▶️</button>
                  </div>

                  {isMazeHidden && !feedback && (
                    <div className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-full font-black animate-pulse z-10">
                      พรางตัวอยู่... ขยับเพื่อดูทาง 🧭
                    </div>
                  )}
                </div>
              )}

              {config.mode === 'matching' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-10">
                  <div className="grid grid-cols-2 gap-x-4 md:gap-x-20 gap-y-3 md:gap-y-4 w-full max-w-3xl">
                    <div className="flex flex-col gap-2 md:gap-3">
                      <span className="text-center font-black text-slate-400 text-[10px] md:text-xs mb-1 md:mb-2 uppercase tracking-widest">วลี/คำพูด</span>
                      {matchingPairs.map((pair) => (
                        <button key={pair.id} onClick={() => handleMatchClick('left', pair.id)} disabled={pair.matched} className={`p-2 md:p-3 rounded-xl md:rounded-2xl shadow-sm md:shadow-md font-black text-[10px] sm:text-xs md:text-base min-h-[50px] transition-all ${pair.matched ? 'bg-green-50 text-green-300 opacity-40' : selectedLeft === pair.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}>
                          {pair.left}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2 md:gap-3">
                      <span className="text-center font-black text-slate-400 text-[10px] md:text-xs mb-1 md:mb-2 uppercase tracking-widest">หมวดหมู่</span>
                      {shuffledRight.map((item, idx) => {
                        const isMatched = matchingPairs.find(p => p.id === item.id)?.matched
                        return (<button key={idx} onClick={() => handleMatchClick('right', item.id)} disabled={isMatched} className={`p-2 md:p-3 rounded-xl md:rounded-2xl shadow-sm md:shadow-md font-black text-[10px] sm:text-xs md:text-base min-h-[50px] transition-all ${isMatched ? 'opacity-20' : 'bg-white text-slate-600 border-2 border-dashed'}`}>{item.text}</button>)
                      })}
                    </div>
                  </div>
                  <p className="mt-8 md:mt-12 text-blue-400 font-bold italic text-xs md:text-base animate-pulse text-center">💡 เลือกวลีทางซ้าย แล้วเลือกหมวดหมู่ที่ถูกต้องทางขวา</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style jsx global>{`
        @keyframes bounce-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .animate-bounce-gentle { animation: bounce-gentle 1.5s ease-in-out infinite; }
        @keyframes jiggle { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
        .animate-jiggle { animation: jiggle 2s ease-in-out infinite; }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
      `}</style>
    </div >
  )
}

export default function ManagementPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-16 h-16 border-8 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div></div>}>
      <ManagementGameInner />
    </Suspense>
  )
}
