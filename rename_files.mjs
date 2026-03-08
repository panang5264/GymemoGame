import fs from 'fs'
import path from 'path'

const BASE = 'e:/GymemoGame/frontend/public/assets_employer'

const renames = [
    // cat3
    ['assess/management/cat3', '\u0e08\u0e23\u0e40\u0e02\u0e49.png', 'crocodile.png'],
    ['assess/management/cat3', '\u0e0a\u0e49\u0e32\u0e07.png', 'elephant.png'],
    ['assess/management/cat3', '\u0e21\u0e49\u0e32\u0e25\u0e32\u0e22.png', 'zebra.png'],
    ['assess/management/cat3', '\u0e22\u0e35\u0e23\u0e32\u0e1f.png', 'giraffe.png'],
    ['assess/management/cat3', '\u0e2b\u0e21\u0e39.png', 'pig.png'],

    // cat4
    ['assess/management/cat4', '\u0e1d\u0e2d\u0e22\u0e02\u0e31\u0e14\u0e2b\u0e21\u0e49\u0e2d.png', 'steel-wool.png'],
    ['assess/management/cat4', '\u0e1f\u0e2d\u0e07\u0e19\u0e49\u0e33.png', 'sponge.png'],
    ['assess/management/cat4', '\u0e41\u0e1b\u0e23\u0e07\u0e02\u0e31\u0e14\u0e2a\u0e49\u0e27\u0e21.png', 'toilet-brush.png'],
    ['assess/management/cat4', '\u0e41\u0e1b\u0e23\u0e07\u0e2a\u0e35\u0e1f\u0e31\u0e19.png', 'toothbrush.png'],
    ['assess/management/cat4', '\u0e44\u0e21\u0e49\u0e16\u0e39.png', 'mop.png'],

    // spatial question images (keep number names, just copy folder is fine, 
    // but rename Thai-named ones)
    ['assess/spatial', '\u0e42\u0e08\u0e17\u0e22\u0e4c\u0e02\u0e49\u0e2d 1.png', 'q1.png'],
    ['assess/spatial', '\u0e42\u0e08\u0e17\u0e22\u0e4c\u0e02\u0e49\u0e2d 2.png', 'q2.png'],
    ['assess/spatial', '\u0e42\u0e08\u0e17\u0e22\u0e4c\u0e02\u0e49\u0e2d3.png', 'q3.png'],
    ['assess/spatial', '\u0e42\u0e08\u0e17\u0e22\u0e4c\u0e02\u0e49\u0e2d 4.png', 'q4.png'],
    ['assess/spatial', '\u0e42\u0e08\u0e17\u0e22\u0e4c\u0e02\u0e49\u0e2d 5.png', 'q5.png'],
    ['assess/spatial', '\u0e42\u0e08\u0e17\u0e22\u0e4c\u0e02\u0e49\u0e2d 6.png', 'q6.png'],
    ['assess/spatial', '\u0e42\u0e08\u0e17\u0e22\u0e4c\u0e02\u0e49\u0e2d 7.png', 'q7.png'],
    ['assess/spatial', '\u0e42\u0e08\u0e17\u0e22\u0e4c\u0e02\u0e49\u0e2d 8.png', 'q8.png'],
    ['assess/spatial', '\u0e0a\u0e49\u0e2d\u0e22 5.jpg', 'choice5.jpg'],
    ['assess/spatial', '\u0e0a\u0e49\u0e2d\u0e22 6.png', 'choice6.png'],
    ['assess/spatial', '\u0e0a\u0e49\u0e2d\u0e22 7.PNG', 'choice7.PNG'],
    ['assess/spatial', '\u0e0a\u0e49\u0e2d\u0e22 8.jpg', 'choice8.jpg'],
    ['assess/spatial', '\u0e0a\u0e49\u0e2d\u0e22\u0e02\u0e49\u0e2d 1.png', 'choice1.png'],
    ['assess/spatial', '\u0e0a\u0e49\u0e2d\u0e22\u0e02\u0e49\u0e2d 2.png', 'choice2.png'],
    ['assess/spatial', '\u0e0a\u0e49\u0e2d\u0e22\u0e02\u0e49\u0e2d 3.jpeg', 'choice3.jpeg'],
    ['assess/spatial', '\u0e0a\u0e49\u0e2d\u0e22\u0e17\u0e4c\u0e02\u0e49\u0e2d 4.png', 'choice4.png'],
    ['assess/spatial', '\u0e14\u0e48\u0e32\u0e191-1.png', 'd1-1.png'],
    ['assess/spatial', '\u0e14\u0e48\u0e32\u0e191-2.png', 'd1-2.png'],
    ['assess/spatial', '\u0e14\u0e48\u0e32\u0e192-1.png', 'd2-1.png'],
    ['assess/spatial', '\u0e14\u0e48\u0e32\u0e192-2.png', 'd2-2.png'],
]

let ok = 0, skip = 0
for (const [dir, oldName, newName] of renames) {
    const src = path.join(BASE, dir, oldName)
    const dst = path.join(BASE, dir, newName)
    if (fs.existsSync(src)) {
        fs.renameSync(src, dst)
        console.log(`  ${dir}/${oldName} -> ${newName}`)
        ok++
    } else {
        console.warn(`  [SKIP] ${dir}/${oldName}`)
        skip++
    }
}
console.log(`\nDone: ${ok} renamed, ${skip} skipped.`)
