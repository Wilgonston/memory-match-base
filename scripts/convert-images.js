/**
 * Convert SVG images to PNG for Base Featured Guidelines compliance
 * 
 * This script converts all SVG assets to PNG format with the correct dimensions
 * required by Base Featured Guidelines.
 * 
 * Requirements:
 * - Icon: 1024×1024 px PNG, no transparency
 * - Cover: 1200×630 px PNG/JPG
 * - Screenshots: 1284×2778 px PNG (portrait)
 * 
 * Usage:
 *   npm install sharp
 *   node scripts/convert-images.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, '..', 'public', 'assets', 'miniapp');

const conversions = [
  {
    input: 'icon-1024.svg',
    output: 'icon-1024.png',
    width: 1024,
    height: 1024,
    background: { r: 0, g: 82, b: 255, alpha: 1 }, // BASE blue, no transparency
  },
  {
    input: 'cover-1200x630.svg',
    output: 'cover-1200x630.png',
    width: 1200,
    height: 630,
    background: { r: 0, g: 82, b: 255, alpha: 1 },
  },
  {
    input: 'screenshot-1-gameplay.svg',
    output: 'screenshot-1-gameplay.png',
    width: 1284,
    height: 2778,
    background: { r: 26, g: 26, b: 46, alpha: 1 },
  },
  {
    input: 'screenshot-2-level-select.svg',
    output: 'screenshot-2-level-select.png',
    width: 1284,
    height: 2778,
    background: { r: 26, g: 26, b: 46, alpha: 1 },
  },
  {
    input: 'screenshot-3-victory.svg',
    output: 'screenshot-3-victory.png',
    width: 1284,
    height: 2778,
    background: { r: 26, g: 26, b: 46, alpha: 1 },
  },
];

async function convertSvgToPng(config) {
  const inputPath = path.join(ASSETS_DIR, config.input);
  const outputPath = path.join(ASSETS_DIR, config.output);

  try {
    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ Input file not found: ${inputPath}`);
      return false;
    }

    console.log(`Converting ${config.input}...`);

    // Read SVG file
    const svgBuffer = fs.readFileSync(inputPath);

    // Convert to PNG with specified dimensions and background
    await sharp(svgBuffer, { density: 300 })
      .resize(config.width, config.height, {
        fit: 'contain',
        background: config.background,
      })
      .png({
        quality: 100,
        compressionLevel: 9,
      })
      .toFile(outputPath);

    // Get file size
    const stats = fs.statSync(outputPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    console.log(`✅ Created ${config.output} (${config.width}×${config.height}, ${fileSizeKB} KB)`);
    return true;
  } catch (error) {
    console.error(`❌ Error converting ${config.input}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🎨 Converting SVG images to PNG for Base Featured Guidelines...\n');

  // Sharp is already imported, no need to check

  // Create assets directory if it doesn't exist
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error(`❌ Assets directory not found: ${ASSETS_DIR}`);
    process.exit(1);
  }

  // Convert all images
  let successCount = 0;
  for (const config of conversions) {
    const success = await convertSvgToPng(config);
    if (success) successCount++;
  }

  console.log(`\n✨ Conversion complete: ${successCount}/${conversions.length} images converted`);

  if (successCount === conversions.length) {
    console.log('\n📝 Next steps:');
    console.log('1. Update minikit.config.ts to use .png files instead of .svg');
    console.log('2. Test images in production environment');
    console.log('3. Verify load times (<3 seconds)');
    console.log('4. Submit for Base Featured placement');
  } else {
    console.log('\n⚠️  Some conversions failed. Please check the errors above.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
