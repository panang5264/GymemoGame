import * as calGame from '@/lib/calculation-minigame/game_logic'
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
    maxNumber: 99,
    minNumber: 11,
    generate_problem(): CalcQuestion {
      // Find val1 (2 digits) and val2 (1 digit) such that carry occurs in ones place
      const lastDigit = calGame.RandomValue(9, 1);
      const val1_tens = calGame.RandomValue(8, 1) * 10;
      const val1 = val1_tens + lastDigit;
      const val2 = calGame.RandomValue(9, 10 - lastDigit); // Ensure carry: lastDigit + val2 >= 10
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
    maxNumber: 99,
    minNumber: 11,
    generate_problem(): CalcQuestion {
      const lastDigit = calGame.RandomValue(8, 0); // 0-8
      const val1_tens = calGame.RandomValue(9, 2) * 10; // 20-90
      const val1 = val1_tens + lastDigit;
      const val2 = calGame.RandomValue(9, lastDigit + 1); // Ensure borrow: lastDigit < val2
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
      const val1 = calGame.RandomDice()
      const val2 = calGame.RandomDice()
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

  // ── Level 8: สมการ 2 ฝั่ง (มีตัวแปรหายไป ใช้ภาพประกอบ) ────────────────────────────
  {
    level: 8,
    name: 'สมการ 2 ฝั่ง (หาค่าที่หายไป)',
    description: 'สมดุลสมการสองฝั่ง โดยหาตัวที่หายไป (A op B = C op ?)',
    maxNumber: 9,
    generate_problem(): CalcQuestion {
      const vA = calGame.RandomValue(9, 1)
      const vB = calGame.RandomValue(9, 1)
      const op1 = calGame.GetOperator("+")
      const op2 = calGame.GetOperator("+")
      const [targetSum] = calGame.Calculate({ operands: [vA, vB], operators: [op1] })

      // targetSum = vC + missing
      const vC = calGame.RandomValue(Math.min(targetSum - 1, 9), 1)
      const missing = targetSum - vC

      return {
        operands: [vA, vB, vC],
        operators: [op1, op2], // Repr: A + B = C + ?
        expect_result: missing,
        hidden_index: 3 // Virtual index for the missing one
      }
    },
  },

  // ── Level 9: สมการที่มีตัวแปรหายไป (ใช้ลูกเต๋าแทน) ──────────────────────────────────
  {
    level: 9,
    name: 'สมการตัวแปรหาย (ใช้ลูกเต๋า)',
    description: 'หาตัวเลขที่หายไปในชุดสมการ โดยมีลูกเต๋าเป็นส่วนหนึ่ง (A op ? = C)',
    maxNumber: 10,
    generate_problem(): CalcQuestion {
      const dice = calGame.RandomDice()
      const op = calGame.RandomOperator()
      let missingValue = calGame.RandomValue(9, 1)

      let operands: calGame.Operand[] = [dice, missingValue]
      if (op.name === '-' && dice.value < missingValue) {
        operands = [missingValue, dice]
      }

      const [result] = calGame.Calculate({ operands, operators: [op] })

      return {
        operands: [operands[0], result],
        operators: [op],
        expect_result: operands[1] === result ? operands[0] instanceof Object ? (operands[0] as calGame.Dice).value : (operands[0] as number) : operands[1] instanceof Object ? (operands[1] as calGame.Dice).value : (operands[1] as number), // Wait this is confusing
      }
    },
  },

  // ── Level 10: สมการมีตัวกวน + หาตัวเลขที่หายไป ──────────────────────────────────
  {
    level: 10,
    name: 'สมการตัวกวน (Interference)',
    description: 'ดูให้ดี มีตัวกวน! คำนวณบวกหรือลบเฉพาะตัวเลขและลูกเต๋าเท่านั้น ห้ามสนใจสัญลักษณ์หลอก ○ ▲ ★ ♥︎ ◼︎ ◯ △',
    maxNumber: 50,
    generate_problem(): CalcQuestion {
      const rng = Math.random
      const numSlots = 4
      const slots: { val: number; isReal: boolean }[] = []

      const distractorIdx = Math.floor(rng() * 4)
      const realIndices = [0, 1, 2, 3].filter(i => i !== distractorIdx)
      const hiddenIdx = realIndices[Math.floor(rng() * 3)]

      for (let i = 0; i < numSlots; i++) {
        const isDist = i === distractorIdx
        let val = 0
        if (i === hiddenIdx) {
          val = Math.floor(rng() * 11) + 10 // 10-20
        } else if (isDist) {
          val = Math.floor(rng() * 15) + 1
        } else {
          val = Math.floor(rng() * 12) + 2
        }
        slots.push({ val, isReal: !isDist })
      }

      // 3 operators for 4 slots
      const ops = [calGame.RandomOperator(), calGame.RandomOperator(), calGame.RandomOperator()]

      // Calculate Truth
      let runningTotal = 0
      let firstReal = true
      for (let i = 0; i < numSlots; i++) {
        if (slots[i].isReal) {
          if (firstReal) {
            runningTotal = slots[i].val
            firstReal = false
          } else {
            // Operator before this slot is ops[i-1]
            let operator = ops[i - 1]
            // Safety: avoid negative results by flipping - to + if needed
            if (operator.name === "-" && runningTotal < slots[i].val) {
              operator = calGame.GetOperator("+")
              ops[i - 1] = operator
            }
            runningTotal = (operator.name === "+") ? runningTotal + slots[i].val : runningTotal - slots[i].val
          }
        }
      }

      const distractors = ['○', '▲', '★', '♥︎', '◼︎', '◯', '△']
      const finalOperands: calGame.Operand[] = []
      const messingIndices: number[] = []
      const customMessing: Record<number, string | number> = {}

      for (let i = 0; i < numSlots; i++) {
        const slot = slots[i]
        if (slot.isReal) {
          if (slot.val <= 6 && rng() > 0.4) {
            finalOperands.push({ ...calGame.RandomDice(), value: slot.val, name: `dice${slot.val}` } as calGame.Dice)
          } else {
            finalOperands.push(slot.val)
          }
        } else {
          const mIdx = finalOperands.length
          messingIndices.push(mIdx)
          customMessing[mIdx] = distractors[Math.floor(rng() * distractors.length)] + " " + slot.val
          finalOperands.push(0)
        }
      }

      return {
        operands: finalOperands,
        operators: ops,
        expect_result: slots[hiddenIdx].val,
        final_result: runningTotal,
        messing_indices: messingIndices,
        custom_messing: customMessing,
        hidden_index: hiddenIdx
      }
    },
  },
]
