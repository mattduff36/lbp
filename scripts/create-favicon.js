const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createFavicon() {
  try {
    const inputPath = path.join(process.cwd(), 'public', 'Logo-trans.png');
    const outputPath = path.join(process.cwd(), 'public', 'favicon.png');

    // Read the input image
    const imageBuffer = await fs.promises.readFile(inputPath);

    // Create favicon in PNG format
    await sharp(imageBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);

    console.log('Favicon created successfully!');
  } catch (error) {
    console.error('Error creating favicon:', error);
  }
}

createFavicon(); 