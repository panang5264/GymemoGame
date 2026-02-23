import * as path from "path"
import { promises as fs } from "fs"
import assert from "assert"

// enum ItemAttributes {
//   WEAR
// }

// interface Item {
//   name: string
//   attributes: Set<ItemAttributes>
// }

type Category = {
  path: string
  question: string
  items: Set<string>
}

const category1: Category = {
  path: "/assets/IsObject/1",
  question: "สิ่งของที่ใช้หรือเกี่ยวข้องกับทะเล",
  items: new Set(["ball", "swimsuit", "slipper", "ice_bucket"])
}

const category_map = new Map<number, Category>()
category_map.set(1, category1)
export const filetype = ".PNG"

export async function getImages(index: number): Promise<[string[], Category | undefined]> {
  assert(category_map.has(index), "Category only have {1}")
  const dir = category_map.get(index)?.path
  try {
    const directoryPath = path.join(process.cwd(), "public" + dir)
    const filesnames = await fs.readdir(directoryPath)
    return [filesnames, category_map.get(index)]
  } catch (err) {
    console.log(err)
    return [[], undefined]
  }
}
