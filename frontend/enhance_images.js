const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = 'e:/GymemoGame/frontend/public/assets_employer/background';
const files = ['Scene1_HQ.png', 'Scene2_HQ.png', 'Scene3_HQ.png'];

async function enhance() {
    for (const file of files) {
        const filePath = path.join(dir, file);
        const outputPath = path.join(dir, file.replace('_HQ.png', '_Final.png'));

        if (!fs.existsSync(filePath)) {
            console.log(`Skipping ${file}, not found.`);
            continue;
        }

        console.log(`Processing ${file}...`);

        try {
            await sharp(filePath)
                .resize({ width: 2000, withoutEnlargement: false }) // Upscale if needed
                .sharpen({ sigma: 1, flat: 1, jagged: 2 }) // Standard DIP sharpening
                .modulate({
                    brightness: 1.05,
                    contrast: 1.15
                }) // Enhance pop
                .png({ quality: 100 })
                .toFile(outputPath);
            console.log(`Enhanced ${file} -> ${outputPath}`);
        } catch (err) {
            console.error(`Error processing ${file}:`, err);
        }
    }
}

enhance();
