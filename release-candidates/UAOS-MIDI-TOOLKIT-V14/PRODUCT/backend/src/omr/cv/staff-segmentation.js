import sharp from 'sharp';

export async function segmentStaffLines(imagePath) {
  const metadata = await sharp(imagePath).metadata();

  const height = metadata.height || 1000;
  const width = metadata.width || 1000;

  const systems = [];
  const estimatedSystemHeight = Math.max(120, Math.floor(height / 4));

  for (let y = 0; y < height; y += estimatedSystemHeight) {
    systems.push({
      x: 0,
      y,
      width,
      height: Math.min(estimatedSystemHeight, height - y),
      staffLines: [
        y + 20,
        y + 32,
        y + 44,
        y + 56,
        y + 68
      ]
    });
  }

  return {
    imagePath,
    width,
    height,
    systems
  };
}
