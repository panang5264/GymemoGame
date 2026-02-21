/**
 * Calculation Mode – level configurations and question generation.
 *
 * All question generators accept a seeded RNG so that questions are
 * deterministic for a given seed (e.g. today's date), making daily
 * challenge questions consistent across sessions.
 */

// ─── Seeded RNG (mulberry32) ──────────────────────────────────────────────────

export function seededRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000
  }
}

/** Convert a YYYY-MM-DD string to a numeric seed. */
export function dateSeed(dateStr: string): number {
  return parseInt(dateStr.replace(/-/g, ''), 10)
}

// ─── Dice helpers ─────────────────────────────────────────────────────────────

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'] as const

function rollDice(rng: () => number): { face: string; val: number } {
  const val = Math.floor(rng() * 6) + 1
  return { face: DICE_FACES[val - 1], val }
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

/** Build `count` choices containing `answer` plus (count-1) distinct wrong values. */
function makeChoices(answer: number, rng: () => number, count = 4): number[] {
  const wrong = new Set<number>()
  let guard = 0
  while (wrong.size < count - 1 && guard < 100) {
    guard++
    const offset = Math.floor(rng() * 14) - 7
    const w = answer + offset
    if (w !== answer) wrong.add(w)
  }
  // Fill in case rng didn't produce enough distinct values
  let fill = 1
  while (wrong.size < count - 1) { wrong.add(answer + fill); fill++ }
  return [answer, ...wrong].sort(() => rng() - 0.5)
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalcQuestion {
  expression: string
  answer: number
  choices: number[]
}

export interface CalcLevel {
  id: number
  /** Thai name shown in UI */
  name: string
  /** Short Thai description */
  description: string
  generate(rng: () => number, count?: number): CalcQuestion[]
}

// ─── Level definitions ────────────────────────────────────────────────────────

export const CALC_LEVELS: CalcLevel[] = [
  // ── Level 1: Add pips of 2 dice ────────────────────────────────────────────
  {
    id: 1,
    name: 'บวกแต้มลูกเต๋า 2 ลูก',
    description: 'บวกแต้มจากลูกเต๋า 2 ลูก',
    generate(rng, count = 4) {
      return Array.from({ length: count }, () => {
        const d1 = rollDice(rng)
        const d2 = rollDice(rng)
        const answer = d1.val + d2.val
        return { expression: `${d1.face} + ${d2.face}`, answer, choices: makeChoices(answer, rng) }
      })
    },
  },

  // ── Level 2: Add/subtract single-digit numbers ─────────────────────────────
  {
    id: 2,
    name: 'บวก/ลบเลขหลักเดียว',
    description: 'บวกหรือลบเลขหลักเดียว',
    generate(rng, count = 4) {
      return Array.from({ length: count }, () => {
        const a = randInt(rng, 1, 9)
        const b = randInt(rng, 1, 9)
        const add = rng() > 0.5
        const answer = add ? a + b : a - b
        return { expression: `${a} ${add ? '+' : '-'} ${b}`, answer, choices: makeChoices(answer, rng) }
      })
    },
  },

  // ── Level 3: Add three single-digit numbers ────────────────────────────────
  {
    id: 3,
    name: 'บวกเลขหลักเดียว 3 จำนวน',
    description: 'บวกเลขหลักเดียว 3 จำนวนเข้าด้วยกัน',
    generate(rng, count = 4) {
      return Array.from({ length: count }, () => {
        const a = randInt(rng, 1, 9)
        const b = randInt(rng, 1, 9)
        const c = randInt(rng, 1, 9)
        const answer = a + b + c
        return { expression: `${a} + ${b} + ${c}`, answer, choices: makeChoices(answer, rng) }
      })
    },
  },

  // ── Level 4: Dice + number ─────────────────────────────────────────────────
  {
    id: 4,
    name: 'ลูกเต๋า + ตัวเลข',
    description: 'บวกหรือลบแต้มลูกเต๋ากับตัวเลข',
    generate(rng, count = 4) {
      return Array.from({ length: count }, () => {
        const d = rollDice(rng)
        const n = randInt(rng, 1, 9)
        const add = rng() > 0.5
        const answer = add ? d.val + n : d.val - n
        return { expression: `${d.face} ${add ? '+' : '-'} ${n}`, answer, choices: makeChoices(answer, rng) }
      })
    },
  },

  // ── Level 5: Two-digit + one-digit with carry ──────────────────────────────
  {
    id: 5,
    name: 'บวกสองหลัก + หนึ่งหลัก (มีทด)',
    description: 'เลขสองหลักบวกเลขหนึ่งหลัก (มีการทด)',
    generate(rng, count = 4) {
      return Array.from({ length: count }, () => {
        const b = randInt(rng, 2, 9)
        const onesA = randInt(rng, 10 - b, 9)   // guarantees carry
        const tensA = randInt(rng, 1, 9)
        const a = tensA * 10 + onesA
        const answer = a + b
        return { expression: `${a} + ${b}`, answer, choices: makeChoices(answer, rng) }
      })
    },
  },

  // ── Level 6: Two-digit − one-digit with borrowing ──────────────────────────
  {
    id: 6,
    name: 'ลบสองหลัก − หนึ่งหลัก (มียืม)',
    description: 'เลขสองหลักลบเลขหนึ่งหลัก (มีการยืม)',
    generate(rng, count = 4) {
      return Array.from({ length: count }, () => {
        const b = randInt(rng, 2, 9)
        const onesA = randInt(rng, 1, b - 1)    // guarantees borrowing
        const tensA = randInt(rng, 1, 9)
        const a = tensA * 10 + onesA
        const answer = a - b
        return { expression: `${a} - ${b}`, answer, choices: makeChoices(answer, rng) }
      })
    },
  },

  // ── Level 7: 3 dice mixed add/subtract ────────────────────────────────────
  {
    id: 7,
    name: 'ลูกเต๋า 3 ลูก (บวก/ลบผสม)',
    description: 'บวกและลบแต้มจากลูกเต๋า 3 ลูก',
    generate(rng, count = 4) {
      return Array.from({ length: count }, () => {
        const d1 = rollDice(rng)
        const d2 = rollDice(rng)
        const d3 = rollDice(rng)
        const op = rng() > 0.5 ? '+' : '-'
        const answer = d1.val + d2.val + (op === '+' ? d3.val : -d3.val)
        return {
          expression: `${d1.face} + ${d2.face} ${op} ${d3.face}`,
          answer,
          choices: makeChoices(answer, rng),
        }
      })
    },
  },

  // ── Level 8: Missing variable (dice as unknown) ────────────────────────────
  {
    id: 8,
    name: 'สมการหาค่าที่ขาด (ลูกเต๋า)',
    description: 'หาค่าที่ขาดในสมการ โดยใช้ลูกเต๋าแทนตัวที่ไม่ทราบค่า',
    generate(rng, count = 4) {
      return Array.from({ length: count }, () => {
        const x = randInt(rng, 1, 9)
        const b = randInt(rng, 1, 9)
        const add = rng() > 0.5
        const total = add ? x + b : x - b
        return {
          expression: `? ${add ? '+' : '-'} ${b} = ${total}`,
          answer: x,
          choices: makeChoices(x, rng),
        }
      })
    },
  },

  // ── Level 9: Missing variable multi-step ──────────────────────────────────
  {
    id: 9,
    name: 'สมการหาค่าที่ขาด (หลายขั้นตอน)',
    description: 'หาค่าที่ขาดในสมการ: a + b = ? + c',
    generate(rng, count = 4) {
      return Array.from({ length: count }, () => {
        const x = randInt(rng, 2, 9)
        const a = randInt(rng, 1, 5)
        const b = randInt(rng, 1, 5)
        const answer = x + a - b      // x + a = ? + b  ⟹  ? = x + a - b
        return {
          expression: `${x} + ${a} = ? + ${b}`,
          answer,
          choices: makeChoices(answer, rng),
        }
      })
    },
  },

  // ── Level 10: Interference + calculation ──────────────────────────────────
  {
    id: 10,
    name: 'คำนวณพร้อมตัวรบกวน',
    description: 'เลือกผลลัพธ์ที่ถูกต้องท่ามกลางตัวรบกวน (ทั้งบวกและลบ)',
    generate(rng, count = 4) {
      return Array.from({ length: count }, () => {
        const a = randInt(rng, 10, 50)
        const b = randInt(rng, 1, 20)
        const useAdd = rng() > 0.5
        const answer = useAdd ? a + b : a - b
        const wrongOp = useAdd ? a - b : a + b     // result if wrong operator
        const wrongNear1 = answer + randInt(rng, 1, 5)
        const wrongNear2 = answer - randInt(rng, 1, 5)
        const allChoices = [answer, wrongOp, wrongNear1, wrongNear2]
        const unique = [...new Set(allChoices)]
        let fill = 1
        while (unique.length < 4) { unique.push(answer + fill * 7); fill++ }
        const choices = unique.slice(0, 4).sort(() => rng() - 0.5)
        return {
          expression: `${a} ${useAdd ? '+' : '-'} ${b}`,
          answer,
          choices,
        }
      })
    },
  },
]
