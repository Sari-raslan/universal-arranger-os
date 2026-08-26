import sharp from 'sharp';

export async function preprocessSheetImage(inputPath, outputPath) {
  await sharp(inputPath)
    .grayscale()
    .normalize()
    .threshold(180)
    .png()
    .toFile(outputPath);

  return {
    inputPath,
    outputPath,
    steps: [
      'grayscale',
      'normalize',
      'threshold'
    ]
  };
}
