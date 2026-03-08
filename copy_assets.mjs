import fs from 'fs'
import path from 'path'

const BASE_SRC = `e:/GymemoGame/frontend/public/assets/Assets'Employer`
const BASE_DST = `e:/GymemoGame/frontend/public/assets_employer`

function mkdirp(dir) {
    fs.mkdirSync(dir, { recursive: true })
}

function copyFile(src, dst) {
    mkdirp(path.dirname(dst))
    fs.copyFileSync(src, dst)
}

function copyDir(src, dst) {
    if (!fs.existsSync(src)) {
        console.warn(`  [SKIP] not found: ${src}`)
        return
    }
    mkdirp(dst)
    for (const entry of fs.readdirSync(src)) {
        const srcEntry = path.join(src, entry)
        const dstEntry = path.join(dst, entry)
        const stat = fs.statSync(srcEntry)
        if (stat.isDirectory()) {
            copyDir(srcEntry, dstEntry)
        } else {
            fs.copyFileSync(srcEntry, dstEntry)
        }
    }
}

// ── Map: [sourceRelative, destRelative, isDir] ──────────────────
const MAP = [
    // Logo
    [`Logo - 1.png`, `logo.png`, false],

    // Background & UI (ASCII names already)
    [`Background`, `background`, true],
    [`UI`, `ui`, true],

    // ตัวละคร -> characters  (individual files renamed to English)
    [`ตัวละคร/คุณตา.png`, `characters/grandpa.png`, false],
    [`ตัวละคร/บุหรี่.png`, `characters/cigarette.png`, false],
    [`ตัวละคร/พฤติกรมมสุขภาพ.png`, `characters/health-behavior.png`, false],
    [`ตัวละคร/สมอง.png`, `characters/brain.png`, false],
    [`ตัวละคร/อุบัติดหตุ.png`, `characters/accident.png`, false],
    [`ตัวละคร/แอลกอฮอล์.png`, `characters/alcohol.png`, false],
    [`ตัวละคร/ไวรัส.png`, `characters/virus.png`, false],

    // Assess ด้าน -> assess
    [`Assess ด้าน/มิติสัมพันธ์`, `assess/spatial`, true],
    [`Assess ด้าน/บริหารจัดการ/หมวดหมู่ที่ 3`, `assess/management/cat3`, true],
    [`Assess ด้าน/บริหารจัดการ/หมวดหมู่ที่ 4`, `assess/management/cat4`, true],
    [`Assess ด้าน/บริหารจัดการ/หมวดหมู่ที่1`, `assess/management/cat1`, true],
    [`Assess ด้าน/บริหารจัดการ/หมวดหมู่ที่2`, `assess/management/cat2`, true],
    [`Assess ด้าน/บริหารจัดการ/เกมเขาวงกต`, `assess/management/maze`, true],
    [`Assess ด้าน/คำนวณ/ตัวเลข`, `assess/calculation/numbers`, true],
    [`Assess ด้าน/คำนวณ/ภาพจุด`, `assess/calculation/dots`, true],
    [`Assess ด้าน/คำนวณ/เกมบวกเลขลบเลข`, `assess/calculation/arithmetic`, true],

    // Profile ผู้เล่น -> profiles
    [`Profile ผู้เล่น/ตัวเปล่า`, `profiles/base`, true],
    [`Profile ผู้เล่น/เสื้อผ้าพื้นเมือง`, `profiles/traditional`, true],
    [`Profile ผู้เล่น/ใส่แว่น`, `profiles/glasses`, true],
    [`Profile ผู้เล่น/ใส่แว่นและเสื้อผ้าพื้นเมือง`, `profiles/glasses-traditional`, true],

    // Asset ด้าน (the non-Assess variant) -> asset
    [`Asset ด้าน`, `asset`, true],
]

console.log('=== Copying assets to ASCII-safe paths ===\n')
let ok = 0, skip = 0
for (const [rel, dstRel, isDir] of MAP) {
    const src = path.join(BASE_SRC, rel)
    const dst = path.join(BASE_DST, dstRel)
    if (!fs.existsSync(src)) {
        console.warn(`  [SKIP] ${rel}`)
        skip++
        continue
    }
    if (isDir) {
        copyDir(src, dst)
        console.log(`  [DIR]  ${rel} -> ${dstRel}`)
    } else {
        copyFile(src, dst)
        console.log(`  [FILE] ${rel} -> ${dstRel}`)
    }
    ok++
}
console.log(`\n=== Done: ${ok} copied, ${skip} skipped ===`)
console.log(`Output: ${BASE_DST}`)
