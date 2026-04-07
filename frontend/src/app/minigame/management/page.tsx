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

// ─── Helper: Random Position with Collision Detection ─────────────────────

const ITEM_SIZE_PERCENT = 22 // Approximate item size as % of container width

function getRandomPos(existingItems: { x?: number; y?: number }[] = []) {
  const maxAttempts = 30
  const marginX = 18 // Keep further from horizontal edges
  const marginY = 15 // Keep further from vertical edges
  const maxY = 45 // Limit height spawn area so it doesn't overlap drop zones
  const minDist = ITEM_SIZE_PERCENT // min distance between item centers (%)

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = marginX + Math.random() * (100 - marginX * 2)
    const y = marginY + Math.random() * (maxY - marginY)

    // Check collision with all existing items
    const hasCollision = existingItems.some(item => {
      if (item.x == null || item.y == null) return false
      const dx = x - item.x
      const dy = (y - item.y) * 1.6 // scale y because aspect ratio
      return Math.sqrt(dx * dx + dy * dy) < minDist
    })

    if (!hasCollision) return { x, y }
  }

  // Fallback: grid placement when no free spot found
  const cols = 3
  const idx = existingItems.length % (cols * 2)
  return {
    x: marginX + (idx % cols) * ((100 - marginX * 2) / (cols - 1 || 1)),
    y: marginY + Math.floor(idx / cols) * 15,
  }
}


// ── Algorithm การสุ่ม Asset Version ไม่ซ้ำ (Shuffle Bag) ───────────────────
function getUniqueRandomVersion(gameKey: string, versions: string[]) {
  if (typeof window === 'undefined') return versions[0]
  const storageKey = `gymemo_history_${gameKey}`
  let playedList = JSON.parse(sessionStorage.getItem(storageKey) || '[]')

  if (playedList.length >= versions.length) playedList = []

  const available = versions.filter(v => !playedList.includes(v))
  const selected = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : versions[0]

  playedList.push(selected)
  sessionStorage.setItem(storageKey, JSON.stringify(playedList))
  return selected
}

// ════════════════════════════════════════════════════════════════════════════
// 🍳  ทำอาหาร (Cooking) – Level 4, 5
// ════════════════════════════════════════════════════════════════════════════

interface CookingRecipe {
  name: string
  ingredients: string[]
  extra: string
  thought: string
  round: number
}

const COOKING_RECIPES: CookingRecipe[] = [
  // Round 1 (Sub-level 1)
  {
    name: 'แตงกวาผัดไข่',
    ingredients: ['แตงกวา', 'ไข่ไก่', 'กระเทียม', 'น้ำตาล', 'น้ำปลา', 'พริกไทย'],
    extra: 'น้ำตาล',
    thought: 'ต้องการหวานเพิ่มจัง...',
    round: 1
  },
  {
    name: 'ผัดไทยกุ้ง',
    ingredients: ['เส้นจันท์', 'กุ้ง', 'น้ำตาล', 'น้ำปลา', 'กุยช่าย', 'เต้าหู้', 'ถั่วงอก'],
    extra: 'น้ำปลา',
    thought: 'ต้องการเค็มเพิ่มจัง...',
    round: 1
  },
  {
    name: 'กะเพราหมูสับ',
    ingredients: ['ข้าว', 'หมูสับ', 'กะเพรา', 'น้ำปลา', 'น้ำตาล', 'พริกแดง'],
    extra: 'พริกแดง',
    thought: 'ต้องการความเผ็ดเพิ่มจัง...',
    round: 1
  },
  // Round 2 (Sub-level 4)
  {
    name: 'ไข่เจียวหมูสับ',
    ingredients: ['ไข่ไก่', 'หมูสับ', 'น้ำปลา'],
    extra: 'น้ำปลา',
    thought: 'อยากได้ความเค็มเพิ่มจัง...',
    round: 2
  },
  {
    name: 'ต้มยำกุ้ง',
    ingredients: ['กุ้ง', 'พริกแดง', 'น้ำปลา', 'น้ำตาล'],
    extra: 'พริกแดง',
    thought: 'อยากได้ความเผ็ดร้อนเพิ่มจัง...',
    round: 2
  },
  // Round 3
  {
    name: 'ข้าวผัดกุ้ง',
    ingredients: ['ข้าวสวย', 'ไข่ไก่', 'กุ้ง', 'แตงกวา', 'น้ำปลา', 'น้ำตาล'],
    extra: 'น้ำตาล',
    thought: 'อยากได้ความกลมกล่อมเพิ่มจัง...',
    round: 3
  },
  {
    name: 'ส้มตำ',
    ingredients: ['กระเทียม', 'พริกแดง', 'น้ำตาล', 'น้ำปลา'],
    extra: 'น้ำปลา',
    thought: 'อยากได้ความนัวเพิ่มจัง...',
    round: 3
  },
  // Round 4 (Sub-level 10, 8 etc.)
  {
    name: 'กะเพราทะเล',
    ingredients: ['กุ้ง', 'ปูนิ่ม', 'พริกแดง', 'กะเพรา', 'น้ำปลา'],
    extra: 'พริกแดง',
    thought: 'ขอความจัดจ้านเพิ่มหน่อย!',
    round: 4
  },
  {
    name: 'ต้มข่าไก่',
    ingredients: ['อกไก่', 'กะทิ', 'เห็ดพัด', 'น้ำตาล', 'น้ำปลา'],
    extra: 'น้ำตาล',
    thought: 'หวานหอมกะทิเพิ่มอีกนิด...',
    round: 4
  }
]

const ROUND_INGREDIENTS_LIST: Record<number, string[]> = {
  1: ['กระเทียม', 'กะเพรา', 'กุยช่าย', 'กุ้ง', 'ข้าวสวย', 'ถั่วงอก', 'น้ำตาล', 'น้ำปลา', 'พริกแดง', 'หมูสับ', 'เต้าหู้', 'เส้นจันท์', 'แตงกวา', 'ไข่ไก่'],
  2: ['กระเทียม', 'กุ้ง', 'น้ำตาล', 'น้ำปลา', 'พริกแดง', 'หมูสับ', 'ไข่ไก่'],
  3: ['กระเทียม', 'กุ้ง', 'ข้าวสวย', 'น้ำตาล', 'น้ำปลา', 'พริกแดง', 'แตงกวา', 'ไข่ไก่'],
  4: ['กุ้ง', 'ปูนิ่ม', 'พริกแดง', 'กะเพรา', 'น้ำปลา', 'อกไก่', 'กะทิ', 'เห็ดพัด', 'น้ำตาล']
}

function getIngPath(name: string, round: number, level: number = 4) {
  // Mapping level to asset village folder: Level 4 maps to village_4, Level 5 to village_5
  const villageFolder = `village_${level === 5 ? 5 : 4}`
  const ext = (level === 5) ? 'png' : 'PNG' // Check: village_5 uses .png, village_4 uses .PNG
  return `${MG_BASE}/${villageFolder}/round_${round}/ingredients/${name}.${ext}`
}

// ════════════════════════════════════════════════════════════════════════════
// 🧭  เขาวงกต (Maze) – Level 6, 7, 8, 9
// ════════════════════════════════════════════════════════════════════════════

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

  // --- Add Multiple Paths (Loops) ---
  // Iterate through internal walls and randomly remove some to create loops/multiple paths
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (maze[r][c] === 1) {
        // Don't remove walls that would create a direct shortcut to the exit too easily
        // 15% chance to turn a wall into a path
        if (Math.random() < 0.15) {
          maze[r][c] = 0
        }
      }
    }
  }

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
          // Cannot pass through the exit (2) if it's not the final destination
          if (currentMaze[nr][nc] === 2 && (nr !== endR || nc !== endC)) {
            continue;
          }
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
    let attempts = 0
    while (!placed && attempts < 100) {
      const kr = Math.floor(Math.random() * (rows - 2)) + 1
      const kc = Math.floor(Math.random() * (cols - 2)) + 1
      if (maze[kr][kc] === 0 && (kr !== 1 || kc !== 1) && (kr !== rows - 2 || kc !== cols - 2)) {
        // Ensure starting point can reach the key
        if (canReach(1, 1, kr, kc, maze)) {
          maze[kr][kc] = 3
          placed = true
        }
      }
      attempts++
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

// ════════════════════════════════════════════════════════════════════════════
// 🗂️  แยกหมวดหมู่ (Sorting) – Level 1, 2, 3
// ════════════════════════════════════════════════════════════════════════════

const MG_BASE = '/Asset_New/management_raw/management'

// --- HELPER: Create items with new path structure ---
const getPath = (villageID: number, round: number, category: string, file: string) => `${MG_BASE}/village_${villageID}/round_${round}/${category}/${file}`

// ── หมู่บ้านที่ 1 (Assets ที่ใช้ในหลายหมู่บ้าน) ───────────────────────────────────

// Round 1
const V1_RED = [
  { id: 'v1r1_r1', label: 'รถดับเพลิง', emoji: '🚒', tags: ['red'], imageUrl: getPath(1, 1, 'red', 'FirefigtherCar.png') },
  { id: 'v1r1_r2', label: 'ดอกกุหลาบ', emoji: '🌹', tags: ['red'], imageUrl: getPath(1, 1, 'red', 'Rose.png') },
  { id: 'v1r1_r3', label: 'ป้ายหยุด', emoji: '🛑', tags: ['red'], imageUrl: getPath(1, 1, 'red', 'StopSign.png') },
  { id: 'v1r1_r4', label: 'พริก', emoji: '🌶️', tags: ['red'], imageUrl: getPath(1, 1, 'red', 'chili.png') },
  { id: 'v1r1_r5', label: 'ตู้ไปรษณีย์', emoji: '📮', tags: ['red'], imageUrl: getPath(1, 1, 'red', 'postbox.png') },
]
const V1_SPHERE = [
  { id: 'v1r1_s1', label: 'ลูกบาสเกตบอล', emoji: '🏀', tags: ['sphere'], imageUrl: getPath(1, 1, 'sphere', 'BasketBall.png') },
  { id: 'v1r1_s2', label: 'โลก', emoji: '🌍', tags: ['sphere'], imageUrl: getPath(1, 1, 'sphere', 'Earth.png') },
  { id: 'v1r1_s3', label: 'ดวงจันทร์', emoji: '🌕', tags: ['sphere'], imageUrl: getPath(1, 1, 'sphere', 'Moon.png') },
  { id: 'v1r1_s4', label: 'ลูกกอล์ฟ', emoji: '⛳', tags: ['sphere'], imageUrl: getPath(1, 1, 'sphere', 'Golf.png') },
  { id: 'v1r1_s5', label: 'ฟองสบู่', emoji: '🫧', tags: ['sphere'], imageUrl: getPath(1, 1, 'sphere', 'Bubble.png') },
]
const V1_OTHER1 = [
  { id: 'v1r1_o1', label: 'ทิชชุ่', emoji: '🏀', tags: [], imageUrl: getPath(1, 1, 'other', 'Tissue.png') },
  { id: 'v1r1_o2', label: 'ไม้บรรทัด', emoji: '🌍', tags: [], imageUrl: getPath(1, 1, 'other', 'Ruler.png') },
  { id: 'v1r1_o3', label: 'กระเป๋าเดินทาง', emoji: '🌕', tags: [], imageUrl: getPath(1, 1, 'other', 'Luggage.png') },
  { id: 'v1r1_o4', label: 'หมวก', emoji: '⛳', tags: [], imageUrl: getPath(1, 1, 'other', 'Cap.png') },
  { id: 'v1r1_o5', label: 'กล้วย', emoji: '🫧', tags: [], imageUrl: getPath(1, 1, 'other', 'Banana.png') },
]

// Round 2
const V1_BLUE = [
  { id: 'v1r2_b1', label: 'ลูกโป่ง', emoji: '🎈', tags: ['blue'], imageUrl: getPath(1, 2, 'blue', 'Ballon.png') },
  { id: 'v1r2_b2', label: 'หมวก', emoji: '🧢', tags: ['blue'], imageUrl: getPath(1, 2, 'blue', 'Cap.png') },
  { id: 'v1r2_b3', label: 'ร่ม', emoji: '☂️', tags: ['blue'], imageUrl: getPath(1, 2, 'blue', 'Umbrella.png') },
  { id: 'v1r2_b4', label: 'เสื้อเชิ้ต', emoji: '👕', tags: ['blue'], imageUrl: getPath(1, 2, 'blue', 'shirt.png') },
  { id: 'v1r2_b5', label: 'กางเกงขาสั้น', emoji: '🩳', tags: ['blue'], imageUrl: getPath(1, 2, 'blue', 'short.png') },
]
const V1_CYLINDER = [
  { id: 'v1r2_c1', label: 'ถ่านไฟฉาย', emoji: '🔋', tags: ['cylinder'], imageUrl: getPath(1, 2, 'cylinder', 'Battery.png') },
  { id: 'v1r2_c2', label: 'กระป๋องโค้ก', emoji: '🥤', tags: ['cylinder'], imageUrl: getPath(1, 2, 'cylinder', 'Coke.png') },
  { id: 'v1r2_c3', label: 'แก้วน้ำ', emoji: '🥛', tags: ['cylinder'], imageUrl: getPath(1, 2, 'cylinder', 'Glass.png') },
  { id: 'v1r2_c4', label: 'ทิชชู่', emoji: '🧻', tags: ['cylinder'], imageUrl: getPath(1, 2, 'cylinder', 'Tissue.png') },
  { id: 'v1r2_c5', label: 'แก้วเก็บความเย็น', emoji: '🍶', tags: ['cylinder'], imageUrl: getPath(1, 2, 'cylinder', 'Tumbler.png') },
]
const V1_OTHER2 = [
  { id: 'v1r2_o1', label: 'แซนด์วิช', emoji: '🏀', tags: [], imageUrl: getPath(1, 2, 'other', 'sandwich.png') },
  { id: 'v1r2_o2', label: 'นกแก้ว', emoji: '🌍', tags: [], imageUrl: getPath(1, 2, 'other', 'Parrot.png') },
  { id: 'v1r2_o3', label: 'กบ', emoji: '🌕', tags: [], imageUrl: getPath(1, 2, 'other', 'Frog.png') },
  { id: 'v1r2_o4', label: 'เป็ด', emoji: '⛳', tags: [], imageUrl: getPath(1, 2, 'other', 'duck.png') },
  { id: 'v1r2_o5', label: 'ขนมปัง', emoji: '🫧', tags: [], imageUrl: getPath(1, 2, 'other', 'Bread.png') },
]

// Round 3
const V1_YELLOW = [
  { id: 'v1r3_y1', label: 'กล้วย', emoji: '🍌', tags: ['yellow'], imageUrl: getPath(1, 3, 'yellow', 'Banana.png') },
  { id: 'v1r3_y2', label: 'รถบัส', emoji: '🚌', tags: ['yellow'], imageUrl: getPath(1, 3, 'yellow', 'Bus.png') },
  { id: 'v1r3_y3', label: 'เป็ดน้อย', emoji: '🐤', tags: ['yellow'], imageUrl: getPath(1, 3, 'yellow', 'Duck.png') },
  { id: 'v1r3_y4', label: 'เสื้อกันฝน', emoji: '🧥', tags: ['yellow'], imageUrl: getPath(1, 3, 'yellow', 'Raincoast.png') },
  { id: 'v1r3_y5', label: 'ดอกทานตะวัน', emoji: '🌻', tags: ['yellow'], imageUrl: getPath(1, 3, 'yellow', 'Sunflower.png') },
]
const V1_TRIANGLE = [
  { id: 'v1r3_t1', label: 'ภูเขา', emoji: '🏔️', tags: ['triangle'], imageUrl: getPath(1, 3, 'triangle', 'Moutain.png') },
  { id: 'v1r3_t2', label: 'พิซซ่า', emoji: '🍕', tags: ['triangle'], imageUrl: getPath(1, 3, 'triangle', 'Pizza.png') },
  { id: 'v1r3_t3', label: 'ไม้บรรทัดเหล็ก', emoji: '📏', tags: ['triangle'], imageUrl: getPath(1, 3, 'triangle', 'Ruler.png') },
  { id: 'v1r3_t4', label: 'แซนด์วิช', emoji: '🥪', tags: ['triangle'], imageUrl: getPath(1, 3, 'triangle', 'Sandwich.png') },
  { id: 'v1r3_t5', label: 'ทรงสามเหลี่ยม', emoji: '🔺', tags: ['triangle'], imageUrl: getPath(1, 3, 'triangle', 'Triangle.png') },
]

const V1_OTHER3 = [
  { id: 'v1r3_o1', label: 'ทีวี', emoji: '🏀', tags: [], imageUrl: getPath(1, 3, 'other', 'TV.png') },
  { id: 'v1r3_o3', label: 'งู', emoji: '🌍', tags: [], imageUrl: getPath(1, 3, 'other', 'Snake.png') },
  { id: 'v1r3_o3', label: 'เสื้อยืด', emoji: '🌕', tags: [], imageUrl: getPath(1, 3, 'other', 'Shirt.png') },
  { id: 'v1r3_o4', label: 'น้ำอัดลม', emoji: '⛳', tags: [], imageUrl: getPath(1, 3, 'other', 'Cola.png') },
  { id: 'v1r3_o5', label: 'ลูกโป่ง', emoji: '🫧', tags: [], imageUrl: getPath(1, 3, 'other', 'Ballon.png') },
]

// ── หมู่บ้านที่ 2 ──────────────────────────────────────────────────────

// Round 1
const V2_ANIMALS = [
  { id: 'v2r1_a1', label: 'จระเข้', emoji: '🐊', tags: ['animal4'], imageUrl: getPath(2, 1, 'cat1', 'Crocodile.png') },
  { id: 'v2r1_a2', label: 'ช้าง', emoji: '🐘', tags: ['animal4'], imageUrl: getPath(2, 1, 'cat1', 'Elephent.png') },
  { id: 'v2r1_a3', label: 'ยีราฟ', emoji: '🦒', tags: ['animal4'], imageUrl: getPath(2, 1, 'cat1', 'Giraffe.png') },
  { id: 'v2r1_a4', label: 'หมู', emoji: '🐷', tags: ['animal4'], imageUrl: getPath(2, 1, 'cat1', 'Pig.jpg') },
  { id: 'v2r1_a5', label: 'ม้าลาย', emoji: '🦓', tags: ['animal4'], imageUrl: getPath(2, 1, 'cat1', 'Zebra.png') },
]
const V2_SCRUBBERS = [
  { id: 'v2r1_s1', label: 'ฝอยขัดหม้อ', emoji: '🧽', tags: ['scrubber'], imageUrl: getPath(2, 1, 'cat2', 'ฝอยขัดหม้อ.png') },
  { id: 'v2r1_s2', label: 'ฟองน้ำ', emoji: '🧽', tags: ['scrubber'], imageUrl: getPath(2, 1, 'cat2', 'ฟองน้ำ.png') },
  { id: 'v2r1_s3', label: 'แปรงขัดส้วม', emoji: '🧹', tags: ['scrubber'], imageUrl: getPath(2, 1, 'cat2', 'แปรงขัดส้วม.png') },
  { id: 'v2r1_s4', label: 'แปรงสีฟัน', emoji: '🪥', tags: ['scrubber'], imageUrl: getPath(2, 1, 'cat2', 'แปรงสีฟัน.png') },
  { id: 'v2r1_s5', label: 'ไม้ถูพื้น', emoji: '🧹', tags: ['scrubber'], imageUrl: getPath(2, 1, 'cat2', 'ไม้ถู.png') },
]
const V2_OTHER1 = [
  { id: 'v2r1_o1', label: 'วอลเลย์บอล', emoji: '🧽', tags: [], imageUrl: getPath(2, 1, 'other', 'วอลเลย์บอล.png') },
  { id: 'v2r1_o2', label: 'เป็ด', emoji: '🧽', tags: [], imageUrl: getPath(2, 1, 'other', 'เป็ด.png') },
  { id: 'v2r1_o3', label: 'ปู', emoji: '🧹', tags: [], imageUrl: getPath(2, 1, 'other', 'ปู.png') },
  { id: 'v2r1_o4', label: 'ปลานิล', emoji: '🪥', tags: [], imageUrl: getPath(2, 1, 'other', 'ปลานิล.png') },
  { id: 'v2r1_o5', label: 'กระทะ', emoji: '🧹', tags: [], imageUrl: getPath(2, 1, 'other', 'กระทะ.png') },
]

// Round 2
const V2_FISH = [
  { id: 'v2r2_f1', label: 'กุ้ง', emoji: '🦐', tags: ['fish'], imageUrl: getPath(2, 2, 'cat1', 'กุ้ง.png') },
  { id: 'v2r2_f2', label: 'ปลาช่อน', emoji: '🐟', tags: ['fish'], imageUrl: getPath(2, 2, 'cat1', 'ปลาช่อน.png') },
  { id: 'v2r2_f3', label: 'ปลาดุก', emoji: '🐟', tags: ['fish'], imageUrl: getPath(2, 2, 'cat1', 'ปลาดุก.png') },
  { id: 'v2r2_f4', label: 'ปลาตะเพียน', emoji: '🐟', tags: ['fish'], imageUrl: getPath(2, 2, 'cat1', 'ปลาตะเพียน.png') },
  { id: 'v2r2_f5', label: 'ปลานิล', emoji: '🐟', tags: ['fish'], imageUrl: getPath(2, 2, 'cat1', 'ปลานิล.png') },
]
const V2_KITCHEN = [
  { id: 'v2r2_k1', label: 'กระทะ', emoji: '🍳', tags: ['kitchen'], imageUrl: getPath(2, 2, 'cat2', 'กระทะ.png') },
  { id: 'v2r2_k2', label: 'ส้อม', emoji: '🍴', tags: ['kitchen'], imageUrl: getPath(2, 2, 'cat2', 'ซ้อม.png') },
  { id: 'v2r2_k3', label: 'ตะหลิว', emoji: '🍳', tags: ['kitchen'], imageUrl: getPath(2, 2, 'cat2', 'ตะหลิว.png') },
  { id: 'v2r2_k4', label: 'มีด', emoji: '🔪', tags: ['kitchen'], imageUrl: getPath(2, 2, 'cat2', 'มีด.png') },
  { id: 'v2r2_k5', label: 'หม้อ', emoji: '🍲', tags: ['kitchen'], imageUrl: getPath(2, 2, 'cat2', 'หม้อ.png') },
]
const V2_OTHER2 = [
  { id: 'v2r2_o1', label: 'รถดับเพลิง', emoji: '🧽', tags: [], imageUrl: getPath(2, 2, 'other', 'รถดับเพลิง.png') },
  { id: 'v2r2_o2', label: 'นก', emoji: '🧽', tags: [], imageUrl: getPath(2, 2, 'other', 'นก.png') },
  { id: 'v2r2_o3', label: 'งู', emoji: '🧹', tags: [], imageUrl: getPath(2, 2, 'other', 'งู.png') },
  { id: 'v2r2_o4', label: 'ไก่', emoji: '🪥', tags: [], imageUrl: getPath(2, 2, 'other', 'ไก่.png') },
  { id: 'v2r2_o5', label: 'กุหลาบ', emoji: '🧹', tags: [], imageUrl: getPath(2, 2, 'other', 'กุหลาบ.png') },
]

// Round 3
const V2_BIRDS = [
  { id: 'v2r3_b1', label: 'อีกา', emoji: '🐦', tags: ['bird'], imageUrl: getPath(2, 3, 'cat1', 'กา.png') },
  { id: 'v2r3_b2', label: 'นก', emoji: '🐦', tags: ['bird'], imageUrl: getPath(2, 3, 'cat1', 'นก.png') },
  { id: 'v2r3_b3', label: 'ห่าน', emoji: '🦢', tags: ['bird'], imageUrl: getPath(2, 3, 'cat1', 'ห่าน.png') },
  { id: 'v2r3_b4', label: 'เป็ด', emoji: '🦆', tags: ['bird'], imageUrl: getPath(2, 3, 'cat1', 'เป็ด.png') },
  { id: 'v2r3_b5', label: 'ไก่', emoji: '🐔', tags: ['bird'], imageUrl: getPath(2, 3, 'cat1', 'ไก่.png') },
]
const V2_CLOTHES = [
  { id: 'v2r3_c1', label: 'กางเกงขายาว', emoji: '👖', tags: ['clothes'], imageUrl: getPath(2, 3, 'cat2', 'กางเกงขายาว.png') },
  { id: 'v2r3_c2', label: 'กางเกงขาสั้น', emoji: '🩳', tags: ['clothes'], imageUrl: getPath(2, 3, 'cat2', 'กางเกงขาสั้น.png') },
  { id: 'v2r3_c3', label: 'ชุดเดรส', emoji: '👗', tags: ['clothes'], imageUrl: getPath(2, 3, 'cat2', 'ชุดเดรส.png') },
  { id: 'v2r3_c4', label: 'เสื้อแขนยาว', emoji: '🧥', tags: ['clothes'], imageUrl: getPath(2, 3, 'cat2', 'เสื้อแขนยาว.png') },
  { id: 'v2r3_c5', label: 'เสื้อแขนสั้น', emoji: '👕', tags: ['clothes'], imageUrl: getPath(2, 3, 'cat2', 'เสื้อแขนสั้น.png') },
]
const V2_OTHER3 = [
  { id: 'v2r3_o1', label: 'หม้อ', emoji: '🧽', tags: [], imageUrl: getPath(2, 3, 'other', 'หม้อ.png') },
  { id: 'v2r3_o2', label: 'วอลเลย์บอล', emoji: '🧽', tags: [], imageUrl: getPath(2, 3, 'other', 'วอลเลย์บอล.png') },
  { id: 'v2r3_o3', label: 'ปู', emoji: '🧹', tags: [], imageUrl: getPath(2, 3, 'other', 'ปู.png') },
  { id: 'v2r3_o4', label: 'ปลานิล', emoji: '🪥', tags: [], imageUrl: getPath(2, 3, 'other', 'ปลานิล.png') },
  { id: 'v2r3_o5', label: 'เต่า', emoji: '🧹', tags: [], imageUrl: getPath(2, 3, 'other', 'เต่า.png') },
]

// ── ตัวล่อ (Distractors) ──────────────────────────────────────────────────
const DISTRACTORS = [
  { id: 'd1', label: 'กล้วยทอด', emoji: '🍌', tags: [], imageUrl: getPath(1, 2, 'other', 'Bread.png') },
  { id: 'd2', label: 'กบ', emoji: '🐸', tags: ['animal4'], imageUrl: getPath(1, 2, 'other', 'Frog.png') },
  { id: 'd3', label: 'นกแก้ว', emoji: '🦜', tags: ['bird'], imageUrl: getPath(1, 2, 'other', 'Parrot.png') },
  { id: 'd4', label: 'เป็ดเหลือง', emoji: '🐤', tags: [], imageUrl: getPath(1, 2, 'other', 'duck.png') },
  { id: 'd5', label: 'แซนด์วิช', emoji: '🥪', tags: [], imageUrl: getPath(1, 2, 'other', 'sandwich.png') },
]

// ── Asset Registry – Village 1 (Level 1) ───────────────────────────────────
// subId 1→v1 / 4→v2 / 7→v3 / 10→v4
const MG_V1_VARIANTS: Record<string, { instruction: string; categories: Category[]; items: Item[] }> = {
  v1: {
    instruction: 'แยกวัตถุสีแดง และ วัตถุรูปทรงกลม',
    categories: [
      { id: 'red', title: 'วัตถุสีแดง 🔴', emoji: '📦', accepts: i => i.tags.includes('red') },
      { id: 'sphere', title: 'วัตถุทรงกลม ⚪', emoji: '📦', accepts: i => i.tags.includes('sphere') },
    ],
    items: [...V1_RED, ...V1_SPHERE, ...V1_OTHER1],
  },
  v2: {
    instruction: 'แยกวัตถุสีฟ้า และ วัตถุทรงกระบอก (รอบที่ 2)',
    categories: [
      { id: 'blue', title: 'วัตถุสีฟ้า 🟦', emoji: '📦', accepts: i => i.tags.includes('blue') },
      { id: 'cylinder', title: 'วัตถุทรงกระบอก 🛢️', emoji: '📦', accepts: i => i.tags.includes('cylinder') },
    ],
    items: [...V1_BLUE, ...V1_CYLINDER, ...V1_OTHER2],
  },
  v3: {
    instruction: 'แยกวัตถุสีเหลือง และ วัตถุทรงสามเหลี่ยม (รอบที่ 3)',
    categories: [
      { id: 'yellow', title: 'วัตถุสีเหลือง 🟨', emoji: '📦', accepts: i => i.tags.includes('yellow') },
      { id: 'triangle', title: 'วัตถุทรงสามเหลี่ยม 🔺', emoji: '📦', accepts: i => i.tags.includes('triangle') },
    ],
    items: [...V1_YELLOW, ...V1_TRIANGLE, ...V1_OTHER3],
  },
  v4: {
    instruction: 'แยกวัตถุของหมู่บ้านที่ 1 ทั้งหมด!',
    categories: [
      { id: 'red', title: 'หมวดสีแดง 🔴', emoji: '📦', accepts: i => i.tags.includes('red') },
      { id: 'sphere', title: 'ทรงกลม ⚪', emoji: '📦', accepts: i => i.tags.includes('sphere') },
    ],
    items: [...V1_RED, ...V1_SPHERE, ...V1_BLUE, ...V1_CYLINDER, ...V1_YELLOW],
  },
}

// ── Asset Registry – Village 2 (Level 2) ───────────────────────────────────
const MG_V2_VARIANTS: Record<string, { instruction: string; categories: Category[]; items: Item[] }> = {
  v1: {
    instruction: 'แยกสัตว์ 4 ขา และ อุปกรณ์สำหรับขัด/แปรง',
    categories: [
      { id: 'animal4', title: 'สัตว์ 4 ขา 🐾', emoji: '🕳️', accepts: i => i.tags.includes('animal4') },
      { id: 'scrubber', title: 'อุปกรณ์ขัด/แปรง 🧽', emoji: '🕳️', accepts: i => i.tags.includes('scrubber') },
    ],
    items: [...V2_ANIMALS, ...V2_SCRUBBERS, ...V2_OTHER1],
  },
  v2: {
    instruction: 'แยกประเภทปลา และ อุปกรณ์ในห้องครัว',
    categories: [
      { id: 'fish', title: 'ประเภทปลา 🐟', emoji: '🕳️', accepts: i => i.tags.includes('fish') },
      { id: 'kitchen', title: 'เครื่องครัว 🍳', emoji: '🕳️', accepts: i => i.tags.includes('kitchen') },
    ],
    items: [...V2_FISH, ...V2_KITCHEN, ...V2_OTHER2],
  },
  v3: {
    instruction: 'แยกประเภทนก และ หมวดหมู่เสื้อผ้า',
    categories: [
      { id: 'bird', title: 'ประเภทนก 🐦', emoji: '🕳️', accepts: i => i.tags.includes('bird') },
      { id: 'clothes', title: 'เสื้อผ้า 👕', emoji: '🕳️', accepts: i => i.tags.includes('clothes') },
    ],
    items: [...V2_BIRDS, ...V2_CLOTHES, ...V2_OTHER3],
  },
  v4: {
    instruction: 'ท้าทายชาวหมู่บ้าน 2: รวมทุกหมวดหมู่!',
    categories: [
      { id: 'animal4', title: 'สัตว์/สิ่งมีชีวิต 🐾', emoji: '🕳️', accepts: i => i.tags.includes('animal4') || i.tags.includes('fish') || i.tags.includes('bird') },
      { id: 'tool', title: 'สิ่งใช้สอย 🧹', emoji: '🕳️', accepts: i => i.tags.includes('scrubber') || i.tags.includes('kitchen') || i.tags.includes('clothes') },
    ],
    items: [...V2_ANIMALS, ...V2_FISH, ...V2_SCRUBBERS, ...V2_KITCHEN],
  },
}

// ── Asset Registry – Village 3 (Mockup: Reusing Village 1 & 2) ───────────────
const MG_V3_VARIANTS: Record<string, { instruction: string; categories: Category[]; items: Item[] }> = {
  v1: {
    instruction: 'ผสมผสาน: แยกสัตว์ และ วัตถุสีแดง (หมู่บ้าน 1+2)',
    categories: [
      { id: 'animal4', title: 'สัตว์ 4 ขา 🐾', emoji: '🕳️', accepts: i => i.tags.includes('animal4') },
      { id: 'red', title: 'วัตถุสีแดง 🔴', emoji: '📦', accepts: i => i.tags.includes('red') },
    ],
    items: [...V2_ANIMALS, ...V1_RED, ...V2_OTHER1],
  },
  v2: {
    instruction: 'ระดับยาก: แยกสีฟ้า และ อุปกรณ์ขัด (หมู่บ้าน 1+2)',
    categories: [
      { id: 'blue', title: 'วัตถุสีฟ้า 🟦', emoji: '📦', accepts: i => i.tags.includes('blue') },
      { id: 'scrubber', title: 'อุปกรณ์ขัด/แปรง 🧽', emoji: '🕳️', accepts: i => i.tags.includes('scrubber') },
    ],
    items: [...V1_BLUE, ...V2_SCRUBBERS, ...V1_CYLINDER],
  },
  v3: {
    instruction: 'จำแนก: ทรงกลม และ เครื่องครัว (หมู่บ้าน 1+2)',
    categories: [
      { id: 'sphere', title: 'ทรงกลม ⚪', emoji: '📦', accepts: i => i.tags.includes('sphere') },
      { id: 'kitchen', title: 'เครื่องครัว 🍳', emoji: '🕳️', accepts: i => i.tags.includes('kitchen') },
    ],
    items: [...V1_SPHERE, ...V2_KITCHEN, ...V2_FISH],
  },
  v4: {
    instruction: 'ท้าทายสุดขีด: สามเหลี่ยม และ เสื้อผ้า! (หมู่บ้าน 1+2)',
    categories: [
      { id: 'triangle', title: 'สามเหลี่ยม 🔺', emoji: '📦', accepts: i => i.tags.includes('triangle') },
      { id: 'clothes', title: 'เสื้อผ้า 👕', emoji: '🕳️', accepts: i => i.tags.includes('clothes') },
    ],
    items: [...V1_TRIANGLE, ...V2_CLOTHES, ...V1_YELLOW, ...V2_BIRDS],
  },
}

// ════════════════════════════════════════════════════════════════════════════
// 📝  จับคู่คำ (Matching) – Level 10
//      phrases อยู่ใน useEffect ภายใน ManagementGameInner (if c.mode === 'matching')
// ════════════════════════════════════════════════════════════════════════════

// ─── Level Config Router ───────────────────────────────────────────────────────
function getLevelConfig(level: number, assetVersion: string = 'v1') {
  let mode: GameMode = 'sorting'
  let items: Item[] = []
  let categories: Category[] = []
  let instruction = 'ทำภารกิจให้สำเร็จตามที่กำหนด'

  // MOCKUP: ตัวอย่างการนำ assetVersion ไปผูกสร้างฐาน Path ให้โฟลเดอร์รูปภาพ
  // ตัวอย่าง path: /Asset_New/Asset_New/management_raw/หมู่บ้านที่ 1/v1/
  const DYNAMIC_BASE_PATH = `/Asset_New/Asset_New/management_raw/หมู่บ้านที่ ${level}/${assetVersion}`
  if (level === 10) {
    mode = "matching"
  } else if (level >= 6) {
    mode = 'maze'
  } else if (level >= 4) {
    mode = 'cooking'
  } else {
    mode = 'sorting'
  }

  switch (level) {
    case 1:
      // ดึงข้อมูลตาม Version (assetVersion) หากไม่มีให้ fallback ไป v1
      const variant = MG_V1_VARIANTS[assetVersion] || MG_V1_VARIANTS['v1']
      instruction = variant.instruction
      categories = variant.categories
      items = [...variant.items]
      break
    case 2:
      // ดึงข้อมูลตาม Version (assetVersion) หากไม่มีให้ fallback ไป v1
      const v2variant = MG_V2_VARIANTS[assetVersion] || MG_V2_VARIANTS['v1']
      instruction = v2variant.instruction
      categories = v2variant.categories
      items = [...v2variant.items]
      break
    case 3:
      // level 3 – swap mode
      const v3variant = MG_V3_VARIANTS[assetVersion] || MG_V3_VARIANTS['v1']
      instruction = v3variant.instruction
      categories = v3variant.categories
      items = [...v3variant.items]
      break

    case 4:
    case 5:
      instruction = 'ปรุงอาหารและปรับรสชาติพิเศษตามความคิดของตัวละคร'
      break

    case 6:
      instruction = 'เดินหาทางออกจากจุดเริ่มต้นไปยังธงสีเขียว (หากไม่เดินจะจางหาย)'
      break
    case 7:
      instruction = 'เขาวงกตขนาด 15x15! หากุญแจและทางออก'
      break
    case 8:
      instruction = 'จำตำแหน่งระเบิดให้ดี! ระเบิดจะซ่อนเมื่อเริ่มเดิน (ต้องหากุญแจด้วย)'
      break
    case 9:
      instruction = 'ระวัง! การควบคุมจะตรงกันข้าม และระเบิดจะถูกซ่อนไว้ (ต้องหากุญแจด้วย)'
      break

    case 10:
      instruction = 'จับคู่คำพูด/วลีให้ตรงหมวดหมู่ (รอบที่ 1-4 ตามลำดับ)'
      break
  }

  console.log(items)

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

  // Asset Version State
  const [assetVersion, setAssetVersion] = useState<string>('v1')

  // Phase State
  const [showExitConfirm, setShowExitConfirm] = useState(false)
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
  const [config, setConfig] = useState(() => getLevelConfig(levelParam, 'v1'))
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
  const [showHint, setShowHint] = useState(false)
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

  useEffect(() => {
    if (phase === 'play' && config.mode === 'cooking') {
      setShowCookingOrder(true)
      const timer = setTimeout(() => setShowCookingOrder(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [phase, config.mode, dishIndex])

  // Initialization
  useEffect(() => {
    // ── กำหนด Version ตามเลขด่านย่อย (1, 4, 7, 10 = v1, v2, v3, v4) ──
    let versionForThisRound = 'v1'
    if (subId === 1) versionForThisRound = 'v1'
    else if (subId === 4) versionForThisRound = 'v2'
    else if (subId === 7) versionForThisRound = 'v3'
    else if (subId === 10) versionForThisRound = 'v4'
    else {
      // โบนัสหรือกรณีอื่นๆ ค่อยใช้ Shuffle Bag
      const ALL_VERSIONS = ['v1', 'v2', 'v3', 'v4']
      const uniqueKey = `management_village_${villageId}`
      versionForThisRound = getUniqueRandomVersion(uniqueKey, ALL_VERSIONS)
    }
    setAssetVersion(versionForThisRound)

    hasSavedRef.current = false
    const c = getLevelConfig(levelParam, versionForThisRound)
    setConfig(c)
    setSpawnQueue(c.items)

    if (c.mode === 'maze') {
      const rows = 15
      const cols = 15
      const needsKey = true
      const needsBombs = true

      const mazeLayout = generateMaze(rows, cols, needsKey, needsBombs)
      setMaze(mazeLayout)
      setPlayerPos({ r: 1, c: 1 })
      setHasKey(false)
      setShowBombs(true)
      setLastMoveTime(Date.now())

      const timer = setTimeout(() => setShowBombs(false), 3000)
      return () => clearTimeout(timer)
    }

    if (c.mode === 'cooking') {
      let roundNum = 1
      if (subId === 1) roundNum = 1
      else if (subId === 4) roundNum = 2
      else if (subId === 7) roundNum = 3
      else if (subId === 10) roundNum = 4
      else roundNum = ((subId - 1) % 4) + 1

      const recipes = COOKING_RECIPES.filter(r => r.round === roundNum)
      setShuffledRecipes(recipes)
      setDishIndex(0)
      startNewCookingDish(0, recipes)
    }

    if (c.mode === 'matching') {
      let phrases: { left: string; right: string }[] = []
      // Select round based on subId cycle or other logic if needed, 
      // but let's map subId 1, 4, 7, 10 to Rounds 1, 2, 3, 4 for Level 10
      let roundNum = 1
      if (subId === 1) roundNum = 1
      else if (subId === 4) roundNum = 2
      else if (subId === 7) roundNum = 3
      else if (subId === 10) roundNum = 4
      else roundNum = (subId % 4) || 4

      if (roundNum === 1) {
        phrases = [
          { left: 'พยาบาล/หมอ', right: 'โรงพยาบาล' },
          { left: 'พ่อครัว', right: 'ห้องครัว' },
          { left: 'ชาวนา', right: 'ทุ่งนา' },
          { left: 'นักบิน', right: 'เครื่องบิน' },
          { left: 'บรรณารักษ์', right: 'ห้องสมุด' },
        ]
      } else if (roundNum === 2) {
        phrases = [
          { left: 'ทะเลทราย', right: 'ภูเขาหิมะ' },
          { left: 'ได้เหรียญทอง', right: 'อันดับสุดท้าย' },
          { left: 'จุดเริ่มต้น', right: 'เส้นชัย' },
          { left: 'บัณฑิต', right: 'คนโง่' },
          { left: 'เศรษฐี', right: 'ยาจก' },
        ]
      } else if (roundNum === 3) {
        phrases = [
          { left: 'แป้งสาลี', right: 'ขนมปัง' },
          { left: 'ทราย', right: 'กระจก' },
          { left: 'เมล็ดโกโก้', right: 'ช็อกโกแลต' },
          { left: 'ข้าว', right: 'สาโท' },
          { left: 'ดินเหนียว', right: 'เครื่องปั้นดินเผา' },
        ]
      } else {
        phrases = [
          { left: 'ค้อน', right: 'ทุบตี,ตอก' },
          { left: 'กรรไกร', right: 'การตัด' },
          { left: 'มีด', right: 'การหั่น,การเฉือน' },
          { left: 'ไม้ขีดไฟ', right: 'การเผา' },
          { left: 'รถเข็น', right: 'การเคลื่อนย้ายของ' },
        ]
      }

      const pairs = phrases.map((p, idx) => ({ ...p, id: idx, matched: false }))
      setMatchingPairs(pairs)

      const shuffled = pairs.map(p => ({ text: p.right, id: p.id })).sort(() => Math.random() - 0.5)
      setShuffledRight(shuffled)
    }
  }, [levelParam, subId])

  // Spawning Logic (Sorting Only)
  useEffect(() => {
    if (phase !== 'play' || config.mode !== 'sorting') return

    const interval = setInterval(() => {
      const currentQueue = spawnQueueRef.current
      const currentPool = activePoolRef.current

      if (currentPool.length < MAX_ACTIVE_ITEMS && currentQueue.length > 0) {
        const nextItem = currentQueue[0]
        // Pass existing items for collision detection
        const { x, y } = getRandomPos(currentPool)
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
    setShowHint(false)
    setHintsUsed(0)
    setIsExtraPhase(false)
    setThoughtBubble(null)
    setFeedback(null)

    // Use all ingredients from the round pool as per requirements
    const roundIngs = ROUND_INGREDIENTS_LIST[recipe.round] || ROUND_INGREDIENTS_LIST[1]
    const items = roundIngs.map(name => ({
      name,
      image: getIngPath(name, recipe.round, levelParam)
    })).sort(() => Math.random() - 0.5)

    setCookingItems(items)

    // Timer is now fully handled by the useEffect watching dishIndex and phase
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
        fetch(`${API_BASE_URL}/analysis/record`, {
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
      const rows = 15
      const cols = 15
      const needsKey = true
      const needsBombs = true
      const mazeLayout = generateMaze(rows, cols, needsKey, needsBombs)
      setMaze(mazeLayout)
      setPlayerPos({ r: 1, c: 1 })
      setHasKey(false)
      setShowBombs(true)
      setLastMoveTime(Date.now())
      setTimeout(() => setShowBombs(false), 3000)
    }

    if (c.mode === 'cooking') {
      let roundNum = 1
      if (subId === 1) roundNum = 1
      else if (subId === 4) roundNum = 2
      else if (subId === 7) roundNum = 3
      else if (subId === 10) roundNum = 4
      else roundNum = ((subId - 1) % 4) + 1

      const recipes = COOKING_RECIPES.filter(r => r.round === roundNum)
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
    <div className="flex flex-col items-center justify-center p-1.5 md:p-4 selection:bg-indigo-100 h-[100dvh] w-full font-['Supermarket'] overflow-hidden">
      <div className="w-full max-w-5xl bg-white rounded-[24px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-full md:h-[calc(100vh-84px)] max-h-screen md:max-h-[980px] relative border border-slate-100">

        {/* Header Bar */}
        <div className="min-h-[3rem] md:min-h-[5.5rem] py-1.5 md:py-4 bg-white border-b border-slate-100 flex flex-row items-center justify-between px-2.5 md:px-8 shrink-0 z-20 rounded-t-[24px] md:rounded-t-[40px] shadow-sm relative">
          <div className="flex items-center gap-2 md:gap-5 flex-1 pr-1.5">
            {phase === 'play' && (
              <button
                onClick={() => setShowExitConfirm(true)}
                className="w-7 h-7 md:w-10 md:h-10 shrink-0 rounded-full bg-red-500/80 hover:bg-red-600 text-white flex items-center justify-center font-black shadow-md border-2 border-red-300 transition-all active:scale-90"
              >
                <span className="text-sm md:text-xl relative -top-[1px]">×</span>
              </button>
            )}
            <div className="w-9 h-9 md:w-14 md:h-14 bg-indigo-50/80 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-3xl relative shrink-0 border border-indigo-100 shadow-inner">
              {levelParam <= 3 ? '📦' : levelParam <= 5 ? '🍳' : levelParam <= 9 ? '🧭' : '📝'}
              {isBonus && (
                <div className="absolute -top-1.5 -right-2 bg-yellow-400 text-yellow-900 text-[8px] md:text-xs font-black px-1.5 py-0.5 rounded-full border border-yellow-500 shadow-sm">
                  x2
                </div>
              )}
            </div>
            <div className="flex flex-col flex-1">
              <h1 className="text-[11px] min-[360px]:text-[12px] sm:text-base md:text-xl lg:text-2xl font-black text-slate-800 tracking-tight leading-tight line-clamp-2 md:line-clamp-none">
                {config.instruction}
              </h1>
            </div>
          </div>
          <div className="flex items-center shrink-0 pl-2.5 md:pl-5 border-l-2 border-slate-100 h-8 md:h-12">
            <div className="flex flex-col items-center justify-center">
              <span className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Score</span>
              <span className="text-xl md:text-4xl font-black text-indigo-600 tabular-nums leading-none mt-0.5">{score}</span>
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

          {/* Exit Confirm Modal */}
          {showExitConfirm && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-[40px] shadow-2xl p-8 max-w-sm w-full border-4 border-red-500 animate-in zoom-in duration-300 text-center">
                <h3 className="text-2xl font-black text-slate-800 mb-4">
                  ⚠️ ยืนยันการออกจากด่าน
                </h3>
                <p className="text-slate-600 font-bold mb-6">
                  หากออกจากด่านตอนนี้ คุณจะได้คะแนนเท่าที่ทำได้ และจะไม่สามารถผ่านไปยังด่านย่อยถัดไปได้ (ต้องใช้กุญแจใหม่เพื่อเริ่มตีด่านนี้) ยืนยันหรือไม่?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowExitConfirm(false)}
                    className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-2xl font-black shadow-sm transition-all active:scale-95"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => {
                      if (modeParam === 'village') {
                        router.push(`/world/${villageId || 1}`);
                      } else if (modeParam === 'daily') {
                        router.push('/daily-challenge');
                      } else {
                        router.push('/minigame');
                      }
                    }}
                    className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-black shadow-lg hover:bg-red-600 transition-all active:scale-95"
                  >
                    ออกเลย
                  </button>
                </div>
              </div>
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
                  {modeParam === 'daily' ? 'เริ่มภารกิจ! ✨' : 'เริ่มเล่น ✨'}
                </button>
              </div>
            </div>
          )}

          {phase === 'done' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-md p-3">
              <div className="max-w-[340px] w-full bg-white rounded-[2rem] p-6 md:p-12 shadow-2xl border-4 border-slate-900/5 text-center animate-in zoom-in">
                <div className="relative mb-3 flex justify-center shrink-0">
                  <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 animate-pulse" />
                  <div className="text-5xl md:text-8xl relative drop-shadow-xl">🎯</div>
                </div>
                <h3 className="text-xl md:text-4xl font-black text-slate-800 tracking-tight leading-none">
                  คะแนนรอบนี้: {score}
                </h3>
                {playedRounds > 1 && (
                  <p className="text-base md:text-3xl font-black text-indigo-600 mb-1 mt-2">
                    เฉลี่ย ({playedRounds} รอบ): {Math.round((accumulatedScore + score) / playedRounds)}
                  </p>
                )}
                <p className="text-slate-400 font-bold mt-2 mb-6 uppercase tracking-widest text-[8px]">เลเวล {levelParam}</p>
                <div className="flex flex-col gap-2">
                  {playedRounds < 3 && (
                    <button
                      onClick={handleReplay}
                      className="w-full py-3 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl font-black text-base shadow-sm transition-all active:scale-95 border border-sky-200"
                    >
                      เล่นซ้ำ (รอบที่ {playedRounds}/3) 🔄
                    </button>
                  )}
                  {modeParam === 'village' ? (
                    <>
                      {subId < 12 ? (
                        <button
                          onClick={() => handleNext(`/world/${villageId}/sublevel/${subId + 1}`)}
                          className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black text-lg shadow-[0_4px_0_#166534] transition-all active:scale-95"
                        >
                          ด่านต่อไป ✨
                        </button>
                      ) : villageId < 10 ? (
                        <button
                          onClick={() => handleNext(`/world/${villageId + 1}`)}
                          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-lg shadow-[0_4px_0_#c2410c] transition-all active:scale-95"
                        >
                          หมู่บ้านต่อไป 🏘️
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleNext(`/world/${villageId}?showSummary=1`)}
                        className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-xl font-black text-base transition-all"
                      >
                        กลับสู่แผนที่ 🗺️
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleNext(modeParam === 'daily' ? '/daily-challenge' : '/world')}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-lg shadow-[0_6px_20px_-6px_rgba(79,70,229,0.4)] transition-all active:scale-95"
                    >
                      ตกลง ✨
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {phase === 'play' && (
            <div className="absolute inset-0 flex flex-col">
              {config.mode === 'sorting' && (
                <div className="flex-1 flex flex-col items-center w-full min-h-0">
                  <div className="flex-1 w-full relative min-h-0">
                    {activePool.map(item => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedSortItemId(prev => prev === item.id ? null : item.id)}
                        className={`absolute flex flex-col items-center justify-center cursor-grab active:cursor-grabbing z-10 select-none animate-in fade-in zoom-in transition-all duration-300 ${selectedSortItemId === item.id ? 'scale-110 -translate-y-3 filter drop-shadow-[0_0_20px_rgba(79,70,229,0.5)]' : ''}`}
                        style={{
                          left: `${item.x}%`,
                          top: `${item.y}%`,
                          transform: 'translate(-50%, -50%)',
                          // Clamp to prevent overflow at edges
                          maxWidth: 'min(112px, 30vw)',
                        }}
                      >
                        <div className={`transition-all duration-300 transform ${selectedSortItemId === item.id ? 'scale-110' : 'group-hover:-translate-y-2'}`}>
                          {item.imageUrl ? (
                            <div className={`w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 overflow-hidden pointer-events-none transition-colors ${selectedSortItemId === item.id ? 'border-indigo-500' : 'border-indigo-100'}`}>
                              <img
                                src={item.imageUrl}
                                className="w-[85%] h-[85%] object-cover mix-blend-multiply"
                                style={{ filter: 'contrast(1.1) brightness(1.05) saturate(1.1)', imageRendering: 'crisp-edges' }}
                                alt={item.label}
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-indigo-100 pointer-events-none">
                              <span className="text-4xl sm:text-6xl md:text-8xl drop-shadow-lg">{item.emoji}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-1 bg-white px-2 py-0.5 sm:px-3 sm:py-1 md:px-5 md:py-2 rounded-full shadow-md text-[10px] sm:text-sm md:text-xl font-black text-indigo-900 border-2 border-slate-100 tracking-wide text-center whitespace-nowrap max-w-[90px] sm:max-w-none truncate sm:overflow-visible">
                          {item.label}
                        </div>
                        <div className="absolute -bottom-4 left-4 right-4 h-2.5 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
                          <div className="h-full bg-pink-500 transition-all linear" style={{ width: `${Math.max(0, 100 - ((Date.now() - (item.createdAt || 0)) / ITEM_LIFETIME * 100))}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="shrink-0 w-full flex justify-center gap-3 min-[400px]:gap-4 sm:gap-8 md:gap-16 px-1 min-[400px]:px-3 sm:px-6 md:px-10 pb-2 min-[400px]:pb-4 pt-2 bg-slate-50/80 backdrop-blur-sm border-t border-slate-100 z-20">
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
                        className={`flex flex-col items-center group cursor-pointer transition-all max-w-[140px] sm:max-w-[180px] ${selectedSortItemId ? 'animate-bounce-gentle' : ''}`}
                      >
                        <div className={`w-20 h-12 sm:w-28 sm:h-16 md:w-40 md:h-24 bg-white rounded-[16px] md:rounded-[28px] border-4 border-dashed shadow-2xl flex items-center justify-center transition-all relative overflow-hidden ${selectedSortItemId ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-300 group-hover:border-blue-400'}`}>
                          {cat.imageUrl ? (
                            <img src={cat.imageUrl} className="w-full h-full object-cover" alt={cat.title} />
                          ) : (
                            <span className="text-3xl sm:text-5xl md:text-7xl drop-shadow-xl transition-transform duration-500 group-hover:scale-110">
                              {cat.emoji || '📦'}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 min-[400px]:mt-2 bg-white px-2 sm:px-4 py-1 sm:py-2 rounded-xl min-[400px]:rounded-2xl shadow-xl border-b-[2px] min-[400px]:border-b-4 border-slate-200 text-[9px] min-[400px]:text-[11px] sm:text-sm md:text-base font-black text-slate-800 uppercase tracking-tighter text-center leading-tight">
                          {cat.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {config.mode === 'cooking' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 md:p-10">
                  <div className="absolute top-0 md:top-0 left-1/2 -translate-x-1/2 pt-2 md:pt-4 flex flex-col items-center z-20 w-fit">
                    <span className="bg-amber-500 text-white px-4 md:px-6 py-1 md:py-2 rounded-full font-black text-xs md:text-xl mb-2 md:mb-4 shadow-lg border-2 border-amber-300 whitespace-nowrap">
                      เมนู: {shuffledRecipes[dishIndex]?.name}
                    </span>
                    {!showCookingOrder && !isExtraPhase && phase === 'play' && (
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => {
                            if (hintsUsed >= 3) return;
                            setShowHint(true);
                            setHintsUsed(h => h + 1);
                            setTimeout(() => setShowHint(false), 2000);
                          }}
                          disabled={showHint || hintsUsed >= 3}
                          className={`mb-2 md:mb-4 px-4 md:px-6 py-1 md:py-2 rounded-full text-[10px] md:text-sm font-black transition-all shadow-md active:scale-95 border-2 ${showHint ? 'bg-indigo-100 text-indigo-400 border-indigo-200' : hintsUsed >= 3 ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-50 animate-bounce-gentle'}`}
                        >
                          {showHint ? '📖 กำลังแสดงสรุปสูตร...' : hintsUsed >= 3 ? '❌ ใช้โควตาใบ้ครบแล้ว' : '💡 ดูสูตรอีกครั้ง'}
                        </button>
                        <span className="text-[10px] md:text-xs font-bold text-slate-500 mb-2">
                          โควตาดูสูตร: {3 - hintsUsed}/3 ครั้ง
                        </span>
                      </div>
                    )}

                    {(showCookingOrder || showHint) && (
                      <div className="bg-white rounded-xl sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-indigo-400 animate-in zoom-in max-w-[300px] sm:max-w-lg overflow-hidden flex flex-col">
                        <div className="flex flex-wrap justify-center gap-1 sm:gap-2 p-2 sm:p-4 pb-3">
                          {currentOrder.map((ing, i) => (
                            <div key={i} className="px-2 sm:px-4 py-0.5 sm:py-2 bg-indigo-50 rounded-lg sm:rounded-2xl text-indigo-700 font-black text-[10px] sm:text-xl border-2 border-indigo-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                              {ing}
                            </div>
                          ))}
                        </div>
                        <div className="w-full h-1.5 sm:h-2 bg-indigo-100/50">
                          <div
                            className="h-full bg-indigo-500 rounded-r-full"
                            style={{
                              animationName: 'shrinkWidth',
                              animationDuration: showCookingOrder ? '8s' : '5s',
                              animationTimingFunction: 'linear',
                              animationFillMode: 'forwards'
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {thoughtBubble && (
                      <div className="relative p-3 md:p-6 bg-white rounded-2xl md:rounded-[2rem] shadow-2xl border-2 md:border-4 border-rose-400 animate-in slide-in-from-top duration-500 max-w-[240px] md:max-w-md">
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l-2 md:border-l-4 border-t-2 md:border-t-4 border-rose-400 rotate-45"></div>
                        <p className="text-rose-600 font-black text-xs md:text-2xl text-center">
                          💭 "{thoughtBubble}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-start pt-14 min-[400px]:pt-28 md:pt-44 pb-3 min-[400px]:pb-8 w-full h-full">
                    <div className="mb-1.5 min-[400px]:mb-5 sm:mb-10 w-full flex justify-center">
                      <div className="relative">
                        <div className="w-36 h-9 min-[400px]:h-12 sm:w-[480px] sm:h-36 lg:w-[600px] lg:h-48 bg-slate-200/50 rounded-full border-b-[3px] sm:border-b-[8px] lg:border-b-[12px] border-slate-300 flex items-center justify-center relative overflow-hidden shadow-inner z-10 transition-all">
                          <div className="flex flex-wrap justify-center gap-1 min-[400px]:gap-2 md:gap-3 p-1 min-[400px]:p-3 md:p-6">
                            {collectedIngredients.map((ing, i) => (
                              <div key={i} className="w-6 h-6 min-[400px]:w-8 min-[400px]:h-8 sm:w-14 sm:h-14 lg:w-20 lg:h-20 bg-white rounded-md md:rounded-xl shadow-sm flex items-center justify-center p-0.5 animate-in bounce-in overflow-hidden relative group border-2 border-slate-100 transition-all">
                                <img src={getIngPath(ing, shuffledRecipes[dishIndex]?.round || 1, levelParam)} className="w-full h-full object-contain" alt={ing} />
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Pan handle or decor */}
                        <div className="absolute top-1/2 -right-6 sm:-right-12 lg:-right-20 w-10 sm:w-20 lg:w-32 h-2 sm:h-4 lg:h-6 bg-slate-400 rounded-full -translate-y-1/2 shadow-md z-0"></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 min-[400px]:grid-cols-4 lg:grid-cols-5 gap-1 min-[400px]:gap-2 lg:gap-3 w-full max-w-[95%] lg:max-w-3xl px-1 min-[400px]:px-2 shrink-0 pb-1">
                      {cookingItems.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => handleCookIngredient(item.name)}
                          className="group flex flex-col items-center gap-1 p-1 bg-white rounded-xl lg:rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all border-b-[2px] lg:border-b-[6px] border-slate-200"
                        >
                          <div className="w-10 h-10 min-[400px]:w-14 min-[400px]:h-14 sm:w-20 sm:h-20 lg:w-32 lg:h-32 bg-slate-50 rounded-lg min-[400px]:rounded-xl lg:rounded-2xl flex items-center justify-center p-1 md:p-3 border-2 border-slate-100">
                            <img src={item.image} className="w-full h-full object-contain group-hover:scale-110 transition-transform" alt={item.name} />
                          </div>
                          <div className="px-2 lg:px-6 py-0.5 lg:py-2 bg-indigo-50 rounded-full border border-indigo-100 text-indigo-800 font-black text-[8px] min-[400px]:text-[9px] lg:text-lg shadow-sm whitespace-nowrap">
                            {item.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {config.mode === 'maze' && (
                <div className={`w-full h-full flex flex-col items-center justify-center p-6 bg-white transition-all duration-1000 relative ${isMazeHidden ? 'bg-slate-900' : ''}`}>
                  <div className="bg-white p-2 rounded-2xl shadow-xl border-2 border-slate-800 transition-opacity duration-500" style={{ opacity: isMazeHidden ? 0 : 1 }}>
                    <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${maze[0]?.length || 1}, minmax(0, 1fr))` }}>
                      {maze.map((row, r) => row.map((cell, c) => (
                        <div
                          key={`${r}-${c}`}
                          className={`w-7 h-7 md:w-10 md:h-10 flex items-center justify-center transition-all duration-300 ${cell === 1 ? 'bg-slate-900' : 'bg-white'
                            }`}
                        >
                          {playerPos.r === r && playerPos.c === c && (
                            <img src="/assets_employer/logo.png" className="w-[85%] h-[85%] object-contain animate-bounce-gentle drop-shadow-md z-10" alt="brain" />
                          )}
                          {cell === 2 && (
                            <div className={`relative w-full h-full flex items-center justify-center ${!hasKey ? 'grayscale opacity-30 brightness-50' : 'animate-bounce'}`}>
                              <span className="text-2xl md:text-3xl drop-shadow-sm filter saturate-150 brightness-110">⛳</span>
                              {!hasKey && (
                                <span className="absolute text-3xl z-20 drop-shadow-md">🔒</span>
                              )}
                            </div>
                          )}
                          {cell === 3 && (
                            <span className="text-xl md:text-2xl animate-jiggle">🔑</span>
                          )}
                          {cell === 4 && showBombs && (
                            <span className="text-xl md:text-2xl">💣</span>
                          )}
                        </div>
                      )))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-6">
                    <div /><button onClick={() => handleMazeMove(-1, 0)} className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center text-2xl border-b-4 border-slate-200 active:scale-95 transition-transform">🔼</button><div />
                    <button onClick={() => handleMazeMove(0, -1)} className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center text-2xl border-b-4 border-slate-200 active:scale-95 transition-transform">◀️</button>
                    <button onClick={() => handleMazeMove(1, 0)} className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center text-2xl border-b-4 border-slate-200 active:scale-95 transition-transform">🔽</button>
                    <button onClick={() => handleMazeMove(0, 1)} className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center text-2xl border-b-4 border-slate-200 active:scale-95 transition-transform">▶️</button>
                  </div>
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
        @keyframes shrinkWidth { from { width: 100%; } to { width: 0%; } }
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
