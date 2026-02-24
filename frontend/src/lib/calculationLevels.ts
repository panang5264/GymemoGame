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
  messing_index?: number
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
  // ── Level 1: Add pips of 2 dice ────────────────────────────────────────────
  {
    level: 1,
    name: 'บวกแต้มลูกเต๋า 2 ลูก',
    description: 'บวกแต้มจากลูกเต๋า 2 ลูก',
    maxNumber: 10,
    generate_problem(): CalcQuestion {
      const val1 = calGame.RandomDice()
      const val2 = calGame.RandomDice()
      const ope = calGame.GetOperator("+")
      const [result, _] = calGame.Calculate({ operands: [val1, val2], operators: [ope] })
      return {
        operands: [val1, val2],
        operators: [ope],
        expect_result: result,
      }
    },
  },

  // ── Level 2: Add/subtract single-digit numbers ─────────────────────────────
  {
    level: 2,
    name: 'บวก/ลบเลขหลักเดียว',
    description: 'บวกหรือลบเลขหลักเดียว',
    maxNumber: 10,
    generate_problem(): CalcQuestion {
      let val1 = 0
      let val2 = 0
      if (typeof this.maxNumber === "number") {
        val1 = calGame.RandomValue(this.maxNumber)
        val2 = calGame.RandomValue(this.maxNumber)
      }
      const ope = calGame.RandomOperator()
      const [result, _] = calGame.Calculate({ operands: [val1, val2], operators: [ope] })
      return {
        operands: [val1, val2],
        operators: [ope],
        expect_result: result,
      }
    },
  },
  //
  // ── Level 3: Add three single-digit numbers ────────────────────────────────
  {
    level: 3,
    name: 'บวกเลขหลักเดียว 3 จำนวน',
    description: 'บวกเลขหลักเดียว 3 จำนวนเข้าด้วยกัน',
    maxNumber: 10,
    generate_problem(): CalcQuestion {
      let val1 = 0
      let val2 = 0
      let val3 = 0
      if (typeof this.maxNumber === "number") {
        val1 = calGame.RandomValue(this.maxNumber)
        val2 = calGame.RandomValue(this.maxNumber)
        val3 = calGame.RandomValue(this.maxNumber)
      }
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
  //
  // ── Level 4: Dice + number ─────────────────────────────────────────────────
  {
    level: 4,
    name: 'ลูกเต๋า + ตัวเลข',
    description: 'บวกหรือลบแต้มลูกเต๋ากับตัวเลข',
    maxNumber: 10,
    generate_problem(): CalcQuestion {
      var val1: calGame.Operand = 0
      var val2: calGame.Operand = 0
      if (typeof this.maxNumber === "number") {
        val1 = calGame.Random(this.maxNumber)
        if (typeof val1 === "number") {
          val2 = calGame.RandomDice()
        } else {
          val2 = calGame.RandomValue(this.maxNumber)
        }
      }
      const ope = calGame.RandomOperator()
      const [result] = calGame.Calculate({ operands: [val1, val2], operators: [ope] })
      return {
        operands: [val1, val2],
        operators: [ope],
        expect_result: result
      }
    },
  },
  //
  // ── Level 5: Two-digit + one-digit with carry ──────────────────────────────
  {
    level: 5,
    name: 'บวกสองหลัก + หนึ่งหลัก (มีทด)',
    description: 'เลขสองหลักบวกเลขหนึ่งหลัก (มีการทด)',
    maxNumber: 20,
    minNumber: 10,
    generate_problem(): CalcQuestion {
      let val1, val2 = 0
      val1 = calGame.RandomValue(this.maxNumber, this.minNumber)
      val2 = calGame.RandomValue(this.maxNumber, this.minNumber)
      const ope = calGame.GetOperator("+")
      const [result] = calGame.Calculate({ operands: [val1, val2], operators: [ope] })
      return {
        operands: [val1, val2],
        operators: [ope],
        expect_result: result
      }
    },
  },
  //
  //   // ── Level 6: Two-digit − one-digit with borrowing ──────────────────────────
  {
    level: 6,
    name: 'ลบสองหลัก − หนึ่งหลัก (มียืม)',
    description: 'เลขสองหลักลบเลขหนึ่งหลัก (มีการยืม)',
    maxNumber: 20,
    minNumber: 10,
    generate_problem(): CalcQuestion {
      let val1, val2 = 0
      val1 = calGame.RandomValue(this.maxNumber, this.minNumber)
      if (this.minNumber === undefined) {
        throw new Error("Please Define min value for Level 6")
      }
      val2 = calGame.RandomValue(this.minNumber)
      const ope = calGame.GetOperator("-")
      const [result] = calGame.Calculate({ operands: [val1, val2], operators: [ope] })
      return {
        operands: [val1, val2],
        operators: [ope],
        expect_result: result
      }
    },
  },
  //
  // ── Level 7: 3 dice mixed add/subtract ────────────────────────────────────
  {
    level: 7,
    name: 'ลูกเต๋า 3 ลูก (บวก/ลบผสม)',
    description: 'บวกและลบแต้มจากลูกเต๋า 3 ลูก',
    maxNumber: 10,
    generate_problem(): CalcQuestion {
      const val1 = calGame.RandomDice()
      const val2 = calGame.RandomDice()
      const val3 = calGame.RandomDice()
      const ope1 = calGame.RandomOperator()
      const ope2 = calGame.RandomOperator()
      const [result] = calGame.Calculate({ operands: [val1, val2, val3], operators: [ope1, ope2] })
      return {
        operands: [val1, val2, val3],
        operators: [ope1, ope2],
        expect_result: result,
      }
    },
  },
  //
  // ── Level 8: Missing variable (dice as unknown) ────────────────────────────
  {
    level: 8,
    name: 'สมการหาค่าที่ขาด (ลูกเต๋า)',
    description: 'หาค่าที่ขาดในสมการ โดยใช้ลูกเต๋าแทนตัวที่ไม่ทราบค่า',
    maxNumber: 10,
    generate_problem(): CalcQuestion {
      var ope = calGame.GetOperator("-")
      const val1 = calGame.RandomValue(this.maxNumber)
      const result = calGame.RandomDice()
      var missingValue: number = 0
      if (val1 >= result.value) {
        [missingValue] = calGame.Calculate({ operands: [val1, result], operators: [ope] })
      } else {
        // NOTE: If val1 < result add result first and subtract with val1
        [missingValue] = calGame.Calculate({ operands: [result, val1], operators: [ope] })
        ope = calGame.GetOperator("+")
      }

      return {
        operands: [val1, result],
        operators: [ope],
        expect_result: missingValue
      }
    },
  },

  // ── Level 9: Missing variable multi-step ──────────────────────────────────
  {
    level: 9,
    name: 'สมการหาค่าที่ขาด (หลายขั้นตอน)',
    description: 'หาค่าที่ขาดในสมการ: a + ? - b = c',
    maxNumber: 10,
    generate_problem(): CalcQuestion {
      const val1 = calGame.RandomValue(this.maxNumber)
      const val2 = calGame.RandomValue(this.maxNumber)
      var ope1 = calGame.GetOperator("-")
      var ope2 = calGame.RandomOperator()
      var [sum] = calGame.Calculate({ operands: [val1, val2], operators: [ope2] })
      const result = calGame.RandomDice()
      var missingValue = 0
      if (sum >= result.value) {
        [missingValue] = calGame.Calculate({ operands: [sum, result], operators: [ope1] })
      } else {
        // NOTE: If val1 < result add result first and subtract with val1
        [missingValue] = calGame.Calculate({ operands: [result, sum], operators: [ope1] })
        ope1 = calGame.GetOperator("+")
      }
      return {
        operands: [val1, val2, result],
        operators: [ope1, ope2],
        expect_result: missingValue
      }
    },
  },

  // ── Level 10: Interference + calculation ──────────────────────────────────
  {
    level: 10,
    name: 'คำนวณพร้อมตัวรบกวน',
    description: 'เลือกผลลัพธ์ที่ถูกต้องท่ามกลางตัวรบกวน (ทั้งบวกและลบ)',
    maxNumber: 10,
    generate_problem(): CalcQuestion {
      const values = [calGame.Random(this.maxNumber), calGame.Random(this.maxNumber), calGame.Random(this.maxNumber)]
      const operator = [calGame.RandomOperator(), calGame.RandomOperator()]
      const messingIndex = Math.floor(Math.random() * values.length)
      values[messingIndex] = 0
      const [result] = calGame.Calculate({ operands: values, operators: operator })
      return {
        operands: values,
        operators: operator,
        expect_result: result,
        messing_index: messingIndex
      }
    },
  },
]
