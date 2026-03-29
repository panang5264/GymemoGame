import * as calGame from '@/lib/calculation-minigame/game_logic'
import exp from 'constants'
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
  operands: calGame.Operand[]
  operators: calGame.Operator[]
  expect_result: number
  final_result?: number // The result of the whole equation (e.g. A + B = C, final_result is C)
  messing_index?: number // Legacy, for backward compatibility
  messing_indices?: number[] // For multiple distractors
  custom_messing?: Record<number, string | number> // Map index to custom content (emoji/symbol/number)
  hidden_index?: number
}

export type CalcLevel = {
  level: number
  /** Thai name shown in UI */
  name: string
  /** Short Thai description */
  description: string
  maxNumber: number
  minNumber?: number
  generate_problem(): CalcQuestion
}

// ─── Level definitions ────────────────────────────────────────────────────────

export const CALC_LEVELS: CalcLevel[] = [
  // ── Level 1: บวก/ลบแต้มลูกเต๋า 2 ลูก ────────────────────────────────────────────
  {
    level: 1,
    name: 'บวก/ลบแต้มลูกเต๋า 2 ลูก',
    description: 'บวกแต้มสองลูกเต๋า (ผลรวม < 10) หรือ ลบลูกเต๋า (ผลลัพธ์เป็นบวก)',
    maxNumber: 10,
    generate_problem(): CalcQuestion {
      const ope = calGame.RandomOperator()
      let val1 = calGame.RandomDice()
      let val2 = calGame.RandomDice()
      if (ope.name === '+') {
        while (val1.value + val2.value >= 10) {
          val1 = calGame.RandomDice()
          val2 = calGame.RandomDice()
        }
      } else {
        if (val1.value < val2.value) [val1, val2] = [val2, val1]
      }
      const [result] = calGame.Calculate({ operands: [val1, val2], operators: [ope] })
      return { operands: [val1, val2], operators: [ope], expect_result: result }
    },
  },
  // ── Level 2: ตัวเลข 1 หลัก บวก/ลบ กัน ──────────────────────────────────────────
  {
    level: 2,
    name: 'บวก/ลบเลข 1 หลัก',
    description: 'ตัวเลข 1 หลัก บวก ลบ กัน',
    maxNumber: 9,
    generate_problem(): CalcQuestion {
      let val1 = calGame.RandomValue(9, 1)
      let val2 = calGame.RandomValue(9, 1)
      const ope = calGame.RandomOperator()
      if (ope.name === '-' && val1 < val2) [val1, val2] = [val2, val1]
      const [result] = calGame.Calculate({ operands: [val1, val2], operators: [ope] })
      return { operands: [val1, val2], operators: [ope], expect_result: result }
    },
  },
  // ── Level 3: บวกเลขหลักเดียว 3 จำนวน ────────────────────────────────
  {
    level: 3,
    name: 'บวก/ลบเลขหลักเดียว 3 จำนวน',
    description: 'บวกเลขหลักเดียว 3 จำนวน (วิธีบวกผสมลบ)',
    maxNumber: 9,
    generate_problem(): CalcQuestion {
      let val1 = calGame.RandomValue(9, 1)
      let val2 = calGame.RandomValue(9, 1)
      let val3 = calGame.RandomValue(9, 1)
      let ope1 = calGame.GetOperator('+')
      let ope2 = calGame.GetOperator('-')
      if (Math.random() > 0.5) [ope1, ope2] = [ope2, ope1]
      let [result] = calGame.Calculate({ operands: [val1, val2, val3], operators: [ope1, ope2] })
      while (result < 0) {
        val1 = calGame.RandomValue(9, 1)
        val2 = calGame.RandomValue(9, 1)
        val3 = calGame.RandomValue(9, 1)
        result = calGame.Calculate({ operands: [val1, val2, val3], operators: [ope1, ope2] })[0]
      }
      return { operands: [val1, val2, val3], operators: [ope1, ope2], expect_result: result }
    },
  },
  // ── Level 4: ลูกเต๋า + ตัวเลข ─────────────────────────────────────────────────
  {
    level: 4,
    name: 'ลูกเต๋า + เลข 1 หลัก 2 ตัว + เลข 2 หลัก 1 ตัว',
    description: 'ลูกเต๋าบวกกับตัวเลข 2 ตัว (เลขหลักเดียว และ เลข 2 หลัก)',
    maxNumber: 19,
    generate_problem(): CalcQuestion {
      let val1 = calGame.RandomDice()
      let val2 = calGame.RandomValue(9, 1)
      let val3 = calGame.RandomValue(30, 10)
      let ope1 = calGame.GetOperator('+')
      let ope2 = calGame.GetOperator('-')
      if (Math.random() > 0.5) [ope1, ope2] = [ope2, ope1]
      let operands: calGame.Operand[] = [val1, val2, val3]
      if (Math.random() > 0.5) operands = [val1, val3, val2]
      let [result] = calGame.Calculate({ operands, operators: [ope1, ope2] })
      while (result < 0) {
        val1 = calGame.RandomDice()
        val2 = calGame.RandomValue(9, 1)
        val3 = calGame.RandomValue(30, 10)
        operands = [val1, val2, val3]
        if (Math.random() > 0.5) operands = [val1, val3, val2]
        result = calGame.Calculate({ operands, operators: [ope1, ope2] })[0]
      }
      return { operands, operators: [ope1, ope2], expect_result: result }
    },
  },
  // ── Level 5: บวกเลข 2 หลัก + เลข 2 หลัก ──────────────────────────────
  {
    level: 5,
    name: 'บวกเลข 2 หลัก',
    description: 'บวกเลข 2 หลัก + เลข 2 หลัก',
    maxNumber: 99,
    generate_problem(): CalcQuestion {
      const val1 = calGame.RandomValue(99, 10)
      const val2 = calGame.RandomValue(99, 10)
      const ope = calGame.GetOperator('+')
      const [result] = calGame.Calculate({ operands: [val1, val2], operators: [ope] })
      return { operands: [val1, val2], operators: [ope], expect_result: result }
    },
  },
  // ── Level 6: ลบเลข 2 หลัก - เลข 2 หลัก ──────────────────────────
  {
    level: 6,
    name: 'ลบเลข 2 หลัก',
    description: 'ลบเลข 2 หลัก - เลข 2 หลัก',
    maxNumber: 99,
    generate_problem(): CalcQuestion {
      let val1 = calGame.RandomValue(99, 10)
      let val2 = calGame.RandomValue(99, 10)
      if (val1 < val2) [val1, val2] = [val2, val1]
      const ope = calGame.GetOperator('-')
      const [result] = calGame.Calculate({ operands: [val1, val2], operators: [ope] })
      return { operands: [val1, val2], operators: [ope], expect_result: result }
    },
  },
  // ── Level 7: สมการ 2 ฝั่ง (หา ? สมดุล) ────────────────────────────────────
  {
    level: 7,
    name: 'สมการ 2 ฝั่ง (หา ? กลางสมการ)',
    description: 'เลข 2 หลัก 1 ค่า และเลข 1 หลัก 2 ค่า (ผสมบวก/ลบกัน)',
    maxNumber: 30,
    generate_problem(): CalcQuestion {
      let A = 0, B = 0, C = 0, missing = 0, ope1: any, ope2: any
      let valid = false
      while (!valid) {
        A = calGame.RandomValue(30, 10)
        B = calGame.RandomValue(9, 1)
        C = calGame.RandomValue(9, 1)
        ope1 = calGame.RandomOperator()
        ope2 = calGame.RandomOperator()
        let leftSum = calGame.Calculate({operands: [A, B], operators: [ope1]})[0]
        if (leftSum < 0) continue
        missing = ope2.name === '+' ? leftSum - C : leftSum + C
        if (missing >= 0 && missing <= 50) valid = true
      }
      const opEq = { name: '=', path: '' } as calGame.Operator
      return {
         operands: [A, B, missing, C],
         operators: [ope1, opEq, ope2],
         expect_result: missing,
         hidden_index: 2
      }
    },
  },
  // ── Level 8: N + ? = สมการมีลูกเต๋า ────────────────────────────
  {
    level: 8,
    name: 'สมการ 2 ฝั่ง (มีลูกเต๋า, หา ? หน้าสมการ)',
    description: 'สมการหน้ามีเลข 2 หลัก 1 ค่า + ?, กลางมีเลข 2 ค่า + ลูกเต๋า (บวกเท่านั้น)',
    maxNumber: 30,
    generate_problem(): CalcQuestion {
      let A = 0, B = 0, C = 0, missing = 0, Dice = calGame.RandomDice()
      let valid = false
      while (!valid) {
        B = calGame.RandomValue(9, 1)
        C = calGame.RandomValue(9, 1)
        Dice = calGame.RandomDice()
        let rightSum = B + C + Dice.value
        A = calGame.RandomValue(Math.min(24, Math.max(10, rightSum - 1)), 10)
        missing = rightSum - A
        if (missing >= 0) valid = true
      }
      const opAdd = calGame.GetOperator("+")
      const opEq = { name: "=", path: "" } as calGame.Operator
      return {
        operands: [A, missing, B, C, Dice],
        operators: [opAdd, opEq, opAdd, opAdd],
        expect_result: missing,
        hidden_index: 1
      }
    },
  },
  // ── Level 9: สมการ 3 ตัว (หน้า 3 หลัง 3) ──────────────────────────────────
  {
    level: 9,
    name: 'สมการ 2 ฝั่ง (หน้า 3 ค่า, หลัง 3 ค่า)',
    description: 'สมการหน้ามี 3 ค่า เลข 2 หลัก 1 ค่า, สมการหลังลูกเต๋าผสมตัวเลข',
    maxNumber: 30,
    generate_problem(): CalcQuestion {
      let A = 0, B = 0, C = 0, D = 0, missing = 0, Dice = calGame.RandomDice()
      let opL2: any, opR1: any, opR2: any
      let valid = false
      while (!valid) {
        A = calGame.RandomValue(30, 10)
        B = calGame.RandomValue(9, 1)
        C = calGame.RandomValue(9, 1)
        D = calGame.RandomValue(9, 1)
        Dice = calGame.RandomDice()
        opL2 = calGame.RandomOperator()
        opR1 = calGame.RandomOperator()
        opR2 = calGame.RandomOperator()
        let rightSum = calGame.Calculate({operands: [Dice.value, C, D], operators: [opR1, opR2]})[0]
        if (rightSum < 0) continue
        let adjustedB = opL2.name === '+' ? -B : B
        missing = rightSum - A + adjustedB
        if (missing >= 0 && missing <= 50) valid = true
      }
      const opAdd = calGame.GetOperator("+")
      const opEq = { name: "=", path: "" } as calGame.Operator
      return {
        operands: [A, missing, B, Dice, C, D],
        operators: [opAdd, opL2, opEq, opR1, opR2],
        expect_result: missing,
        hidden_index: 1
      }
    },
  },
  // ── Level 10: สมการมีตัวกวน + หาตัวเลขที่หายไป ──────────────────────────────────
  {
    level: 10,
    name: 'สมการตัวกวน (มีตัวหลอก)',
    description: 'ด่าน 10: ดูให้ดี มีตัวกวน! บวกหรือลบตัวเลขหรือรูปลูกเต๋าที่มีจุดเท่านั้น',
    maxNumber: 40,
    generate_problem(): CalcQuestion {
      let missing = 0, A = 0, B = 0, C = 0, D = 0, E = 0, Dice = calGame.RandomDice()
      let opR1: any, opR2: any, opR3: any
      let valid = false
      while (!valid) {
        A = calGame.RandomValue(9, 1)
        B = calGame.RandomValue(30, 10)
        C = calGame.RandomValue(9, 1)
        D = calGame.RandomValue(9, 1)
        E = calGame.RandomValue(9, 1)
        Dice = calGame.RandomDice()
        opR1 = calGame.RandomOperator()
        opR2 = calGame.RandomOperator()
        opR3 = calGame.RandomOperator()
        let rightSum = calGame.Calculate({operands: [C, D, E, Dice.value], operators: [opR1, opR2, opR3]})[0]
        if (rightSum < 0) continue
        missing = rightSum - A + B
        if (missing >= 0 && missing <= 50) valid = true
      }
      const opAdd = calGame.GetOperator("+")
      const opSub = calGame.GetOperator("-")
      const opEq = { name: "=", path: "" } as calGame.Operator
      const distractors = ['❌', '✖', '○', '▲', '★', '♥︎', '◼︎', '◯', '△']
      const distSym = distractors[Math.floor(Math.random() * distractors.length)]
      return {
        operands: [missing, A, B, 0, C, D, E, Dice],
        operators: [opAdd, opSub, opAdd, opEq, opR1, opR2, opR3],
        expect_result: missing,
        hidden_index: 0,
        messing_indices: [3],
        custom_messing: { 3: distSym }
      }
    },
  },
]
