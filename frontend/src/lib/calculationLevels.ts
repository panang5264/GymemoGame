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
    description: 'บวกหรือลบแต้มจากลูกเต๋า 2 ลูก (ผลบวก < 10)',
    maxNumber: 10,
    generate_problem(): CalcQuestion {
      const ope = calGame.RandomOperator()
      let val1 = calGame.RandomDice()
      let val2 = calGame.RandomDice()

      if (ope.name === '+') {
        // Ensure sum < 10
        while (val1.value + val2.value >= 10) {
          val1 = calGame.RandomDice()
          val2 = calGame.RandomDice()
        }
      } else {
        // Ensure result >= 0
        if (val1.value < val2.value) {
          [val1, val2] = [val2, val1]
        }
      }

      const [result] = calGame.Calculate({ operands: [val1, val2], operators: [ope] })
      return {
        operands: [val1, val2],
        operators: [ope],
        expect_result: result,
      }
    },
  },

  // ── Level 2: บวก/ลบเลขหลักเดียว ─────────────────────────────
  {
    level: 2,
    name: 'บวก/ลบเลขหลักเดียว',
    description: 'บวกหรือลบเลขหลักเดียว',
    maxNumber: 9,
    generate_problem(): CalcQuestion {
      let val1 = calGame.RandomValue(9, 1)
      let val2 = calGame.RandomValue(9, 1)
      const ope = calGame.RandomOperator()
      if (ope.name === '-' && val1 < val2) {
        [val1, val2] = [val2, val1]
      }
      const [result] = calGame.Calculate({ operands: [val1, val2], operators: [ope] })
      return {
        operands: [val1, val2],
        operators: [ope],
        expect_result: result,
      }
    },
  },

  // ── Level 3: บวกเลขหลักเดียว 3 จำนวน ────────────────────────────────
  {
    level: 3,
    name: 'บวกเลขหลักเดียว 3 จำนวน',
    description: 'บวกเลขหลักเดียว 3 จำนวนเข้าด้วยกัน',
    maxNumber: 9,
    generate_problem(): CalcQuestion {
      const val1 = calGame.RandomValue(9, 1)
      const val2 = calGame.RandomValue(9, 1)
      const val3 = calGame.RandomValue(9, 1)
      const ope1 = calGame.GetOperator("+")
      const ope2 = calGame.GetOperator("+")
      const [result] = calGame.Calculate({ operands: [val1, val2, val3], operators: [ope1, ope2] })
      return {
        operands: [val1, val2, val3],
        operators: [ope1, ope2],
        expect_result: result,
      }
    },
  },

  // ── Level 4: ลูกเต๋า + ตัวเลข ─────────────────────────────────────────────────
  {
    level: 4,
    name: 'ลูกเต๋า + ตัวเลข',
    description: 'บวกหรือลบแต้มลูกเต๋ากับตัวเลข',
    maxNumber: 9,
    generate_problem(): CalcQuestion {
      const val1 = calGame.RandomDice()
      const val2 = calGame.RandomValue(9, 1)
      const ope = calGame.RandomOperator()
      let operands: calGame.Operand[] = [val1, val2]
      // Ensure positive result
      if (ope.name === '-' && val1.value < val2) {
        operands = [val2, val1]
      }
      const [result] = calGame.Calculate({ operands, operators: [ope] })
      return {
        operands,
        operators: [ope],
        expect_result: result
      }
    },
  },

  // ── Level 5: บวกเลข 2 หลัก + 1 หลัก (มีตัวทด) ──────────────────────────────
  {
    level: 5,
    name: 'บวกเลข 2 หลัก + 1 หลัก (มีตัวทด)',
    description: 'เลขสองหลักบวกเลขหนึ่งหลัก แบบมีการทดหลัก',
    maxNumber: 30,
    minNumber: 10,
    generate_problem(): CalcQuestion {
      // Find val1 (2 digits) and val2 (1 digit) such that carry occurs in ones place
      // const lastDigit = calGame.RandomValue(9, 1);
      // const val1_tens = calGame.RandomValue(8, 1);
      if (!this.minNumber) {
        this.minNumber = 10;
      }
      const val1 = calGame.RandomValue(this.maxNumber, this.minNumber);
      const val2 = calGame.RandomValue(this.minNumber, 0); // Ensure carry: lastDigit + val2 >= 10
      const ope = calGame.GetOperator("+")
      const [result] = calGame.Calculate({ operands: [val1, val2], operators: [ope] })
      return {
        operands: [val1, val2],
        operators: [ope],
        expect_result: result
      }
    },
  },

  // ── Level 6: ลบเลข 2 หลัก - 1 หลัก (มีการยืม) ──────────────────────────
  {
    level: 6,
    name: 'ลบเลข 2 หลัก - 1 หลัก (มีการยืม)',
    description: 'เลขสองหลักลบเลขหนึ่งหลัก แบบมีการยืมหลัก',
    maxNumber: 30,
    minNumber: 10,
    generate_problem(): CalcQuestion {
      if (!this.minNumber) {
        this.minNumber = 10;
      }
      const val1 = calGame.RandomValue(this.maxNumber, this.minNumber);
      const val2 = calGame.RandomValue(this.minNumber, 0); // Ensure carry: lastDigit + val2 >= 10
      const ope = calGame.GetOperator("-")
      const [result] = calGame.Calculate({ operands: [val1, val2], operators: [ope] })
      return {
        operands: [val1, val2],
        operators: [ope],
        expect_result: result
      }
    },
  },

  // ── Level 7: นับจุดในรูปภาพแล้วนำมาบวก/ลบ ────────────────────────────────────
  {
    level: 7,
    name: 'นับจำนวนจุดแล้วบวก/ลบ',
    description: 'นับแต้มจากภาพแล้วนำมาคำนวณบวกหรือลบ',
    maxNumber: 10,
    generate_problem(): CalcQuestion {
      const val1 = calGame.RandomDotImage()
      const val2 = calGame.RandomDotImage()
      const ope = calGame.RandomOperator()
      let operands: calGame.Operand[] = [val1, val2]
      if (ope.name === '-' && val1.value < val2.value) {
        operands = [val2, val1]
      }
      const [result] = calGame.Calculate({ operands, operators: [ope] })
      return {
        operands,
        operators: [ope],
        expect_result: result,
      }
    },
  },

  // ── Level 8: N + N = ภาพจุด - ? ────────────────────────────
  {
    level: 8,
    name: 'สมการ 2 ฝั่ง (N + N = ภาพจุด - ?)',
    description: 'คำนวณสองฝั่งให้เท่ากัน โดยใช้ภาพจุดประกอบ (ผลรวมไม่เกิน 12)',
    maxNumber: 6,
    generate_problem(): CalcQuestion {
      const rng = Math.random
      // We need Num1 + Num2 = Dots - Missing
      // To keep it simple and within dot image limits (max 12):
      // Let sum = 4-9
      const vA = Math.floor(rng() * 4) + 2 // 2-5
      const vB = Math.floor(rng() * 4) + 2 // 2-5
      const sum = vA + vB // 4-10

      // Dots must be > sum. dotImages are 6-12.
      let vDots = calGame.RandomDotImage()
      while (vDots.value <= sum) {
        vDots = calGame.RandomDotImage()
      }

      const missing = vDots.value - sum

      const opAdd = calGame.GetOperator("+")
      const opSub = calGame.GetOperator("-")
      const opEq = { name: "=", path: "" } as calGame.Operator

      return {
        operands: [vA, vB, vDots, missing],
        operators: [opAdd, opEq, opSub],
        expect_result: missing,
        hidden_index: 3 // The "?" at the very end
      }
    },
  },

  // ── Level 9: สมการ 3 ตัว (หน้า 3 หลัง 3) ──────────────────────────────────
  {
    level: 9,
    name: 'สมการ 2 ฝั่ง (หน้า 3 ตัว / หลัง 3 ตัว)',
    description: 'สมดุลสมการที่มี 3 จำนวนในแต่ละฝั่ง (A + B + ? = C + Dice + D)',
    maxNumber: 10,
    generate_problem(): CalcQuestion {
      // Structure: Num1 + Num2 + ? = Num3 + Dice + Num4
      // Use user's example values as a base: 3, B, ?, 2, Dice, 16
      const v1 = calGame.RandomValue(this.maxNumber);
      const v2 = calGame.RandomValue(this.maxNumber);

      const v3 = calGame.RandomValue(this.maxNumber);
      const vDice = calGame.RandomDice() // "Dice"
      const v4 = calGame.RandomValue(this.maxNumber);


      const rightSum = v3 + vDice.value + v4
      const leftKnown = v1 + v2

      // We need leftKnown + missing = rightSum => missing = rightSum - leftKnown
      // Ensure rightSum > leftKnown
      let missing = rightSum - leftKnown

      // If missing is negative or too small, adjust v4
      let adjustedV4 = v4
      if (missing <= 0) {
        adjustedV4 = v4 + (Math.abs(missing) + 5)
        missing = v3 + vDice.value + adjustedV4 - leftKnown
      }

      const opAdd = calGame.GetOperator("+")
      const opEq = { name: "=", path: "" } as calGame.Operator

      return {
        operands: [v1, v2, missing, v3, vDice, adjustedV4],
        operators: [opAdd, opAdd, opEq, opAdd, opAdd],
        expect_result: missing,
        hidden_index: 2 // The third operand (index 2)
      }
    },
  },

  // ── Level 10: สมการมีตัวกวน + หาตัวเลขที่หายไป ──────────────────────────────────
  {
    level: 10,
    name: 'สมการตัวกวน (Interference Level)',
    description: 'คำนวณเฉพาะตัวเลขและลูกเต๋า! ห้ามสนใจสัญลักษณ์หลอก และเครื่องหมายที่ติดกับสัญลักษณ์หลอก',
    maxNumber: 20,
    generate_problem(): CalcQuestion {
      const rng = Math.random
      const numSlots = 4
      const slots: calGame.Operand[] = []

      // To avoid "... ? - = " or confusing sequences, let's pick distractor index carefully
      // User said: "ห้าม มีลบแบบ ลูกเต๋า + ? -= "
      // We'll place distractor at index 1 or 2 (middle) to keep equation structure clear
      const distractorIdx = Math.floor(rng() * 2) + 1 // index 1 or 2
      const realIndices = [0, 1, 2, 3].filter(i => i !== distractorIdx)
      const hiddenIdx = realIndices[Math.floor(rng() * (numSlots - 1))]

      for (let i = 0; i < numSlots; i++) {
        slots.push(calGame.Random(this.maxNumber))
      }

      // 3 operators for 4 slots
      const ops = [calGame.RandomOperator(), calGame.RandomOperator(), calGame.RandomOperator()]

      // Rule: Operator before distractor should be '+' to avoid " - Dist =" looking like " -= "
      ops[distractorIdx - 1] = calGame.GetOperator("+");

      // Calculate Truth
      const calOperands = slots.filter((value, index, arr) => index !== distractorIdx)
      let calOperators = ops.filter((val, index, arr) => index !== distractorIdx - 1)
      let [runningTotal] = calGame.Calculate({ operands: calOperands, operators: calOperators })

      // If result is negative, swap one +/- operator and convert total to positive
      if (runningTotal < 0) {
        for (let i = 0; i < ops.length; i++) {
          const ope = ops[i]
          const target = (ope.name === "-") ? "+" : "-"
          ops[i] = calGame.GetOperator(target)
        }
        calOperators = ops.filter((val, index, arr) => index !== distractorIdx - 1)
        const [newTotal] = calGame.Calculate({ operands: calOperands, operators: calOperators })
        runningTotal = newTotal
        console.log(runningTotal)
      }

      const distractors = ['○', '▲', '★', '♥︎', '◼︎', '◯', '△']
      const finalOperands: calGame.Operand[] = slots
      const messingIndices: number[] = []
      const customMessing: Record<number, string | number> = {}
      let expectedResult = 0;

      for (let i = 0; i < numSlots; i++) {
        const slot = slots[i];
        let val = 0;
        if (typeof slot !== "number") {
          val = slot.value
        } else {
          val = slot
        }
        if (i === distractorIdx) {
          const mIdx = finalOperands.length
          messingIndices.push(mIdx)
          // Add a symbol and a number, but make sure it's distinct
          customMessing[mIdx] = distractors[Math.floor(rng() * distractors.length)] + " " + val
          finalOperands[i] = 0;
        } else if (i === hiddenIdx) {
          expectedResult = val;
        }
      }

      console.log(expectedResult);


      return {
        operands: finalOperands,
        operators: ops,
        expect_result: expectedResult,
        final_result: runningTotal,
        messing_indices: messingIndices,
        custom_messing: customMessing,
        hidden_index: hiddenIdx
      }
    },
  },
]
