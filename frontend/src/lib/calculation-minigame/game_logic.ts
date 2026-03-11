export type Dice = {
  name: string
  path: string
  value: number
}

export type Operator = {
  name: string
  path: string
}

const path_to_dice = "/assets/calculation/dice/"
const diceImages: Dice[] = [
  { name: "dice1", path: path_to_dice + "dice1.PNG", value: 1 },
  { name: "dice2", path: path_to_dice + "dice2.PNG", value: 2 },
  { name: "dice3", path: path_to_dice + "dice3.PNG", value: 3 },
  { name: "dice4", path: path_to_dice + "dice4.PNG", value: 4 },
  { name: "dice5", path: path_to_dice + "dice5.PNG", value: 5 },
  { name: "dice6", path: path_to_dice + "dice6.PNG", value: 6 },
]

const path_to_dot = "/Asset ด้าน/คำนวณ/ภาพจุด/"
const dotImages: Dice[] = [
  { name: "dot6", path: path_to_dot + "6.PNG", value: 6 },
  { name: "dot7", path: path_to_dot + "7.PNG", value: 7 },
  { name: "dot8", path: path_to_dot + "8.PNG", value: 8 },
  { name: "dot9", path: path_to_dot + "9.PNG", value: 9 },
  { name: "dot10", path: path_to_dot + "10.PNG", value: 10 },
  { name: "dot11", path: path_to_dot + "11.PNG", value: 11 },
  { name: "dot12", path: path_to_dot + "12.PNG", value: 12 },
]

const operatorImages: Operator[] = [
  { name: "+", path: path_to_dice + "plus.PNG" },
  { name: "-", path: path_to_dice + "minus.PNG" },
]

export function GetOperator(name: string): Operator {
  const ope = operatorImages.find((value, index, arr) => {
    return value.name === name
  })
  if (ope === undefined) {
    throw new Error(`There is no Operator name with ${name}
only ${operatorImages}`)
  }
  return ope
}

export type Operand = Dice | number

export function Random(maxNumber: number): Operand {
  const types = ["d", "n"]
  const type = types[Math.floor(Math.random() * types.length)]
  let value: Operand = 0
  switch (type) {
    case "d":
      value = diceImages[Math.floor(Math.random() * diceImages.length)]
      return value
    case "n":
      value = Math.floor(Math.random() * maxNumber)
      return value
    default:
      return 0
  }
}

export function RandomDice(): Dice {
  const val1 = diceImages[Math.floor(Math.random() * diceImages.length)]
  return val1
}

export function RandomDotImage(): Dice {
  let val1 = dotImages[Math.floor(Math.random() * dotImages.length)]
  if (typeof window !== 'undefined') {
    const last = sessionStorage.getItem('lastDotImage')
    if (last && dotImages.length > 1) {
      let tries = 0
      while (val1.name === last && tries < 10) {
        val1 = dotImages[Math.floor(Math.random() * dotImages.length)]
        tries++
      }
    }
    sessionStorage.setItem('lastDotImage', val1.name)
  }
  return val1
}

export function RandomValue(maxNumber: number, minNumber: number = 0): number {
  const val1 = Math.floor(Math.random() * (maxNumber - minNumber + 1) + minNumber)
  return val1
}

export function RandomOperator(): Operator {
  return operatorImages[Math.floor(Math.random() * operatorImages.length)]
}

// NOTE: For calculation type 4
export function CheckMissingValue(answer: number, actual_value: Operand): boolean {
  if (typeof actual_value === "number") {
    return answer === actual_value
  } else {
    return answer === actual_value.value
  }
}


// export function Calculate(answer: number, val1: number, val2: number, operator_name: string): boolean {
//   console.log(operator_name)
//   switch (operator_name) {
//     case "+":
//       console.log(val1 + val2)
//       return answer === (val1 + val2)
//     case "-":
//       console.log(val1 - val2)
//       return answer == (val1 - val2)
//     default:
//       return false
//   }
// }

type CalculateParams = {
  answer?: number
  operands: Operand[]
  operators: Operator[]
}

export function Calculate({ answer, operands, operators }: CalculateParams): [number, boolean] {
  if (operators.length !== operands.length - 1) {
    throw new Error("Invalid expression")
  }

  let result = 0
  if (typeof operands[0] === "number") {
    result = operands[0]
  } else {
    result = operands[0].value
  }

  for (let i = 1; i < operands.length; i++) {
    const value = operands[i]
    const operator = operators[i - 1]
    if (typeof value === "number") {
      result = operate(result, value, operator)
    } else {
      result = operate(result, value.value, operator)
    }
  }
  return [result, answer === result]
}

function operate(a: number, b: number, operator: Operator): number {
  let result = 0
  switch (operator.name) {
    case "+":
      result = a + b
      break;
    case "-":
      result = a - b
      break;
    default:
      throw new Error("Invalid Operator or Doesn't add to operate function")
  }
  return result;
}
