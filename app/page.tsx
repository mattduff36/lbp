import ClientHero from './components/ClientHero';
import AnimatedPortfolio from './components/AnimatedPortfolio';
import fs from 'fs';
import path from 'path';

const galleries = [
  { name: 'Wedding', path: '/portfolio/wedding', localDir: 'wedding' },
  { name: 'Portrait', path: '/portfolio/portrait', localDir: 'portrait' },
  { name: 'Lifestyle', path: '/portfolio/lifestyle', localDir: 'lifestyle' },
  { name: 'Landscape', path: '/portfolio/landscape', localDir: 'landscape' },
  { name: 'Animals', path: '/portfolio/animals', localDir: 'animals' },
  { name: 'Sport', path: '/portfolio/sport', localDir: 'sport' },
];

const getPreviewImageSrc = (categoryDir: string): string | null => {
  const directoryPath = path.join(process.cwd(), 'public', 'portfolio_images', categoryDir.toLowerCase());
  try {
    if (!fs.existsSync(directoryPath)) {
      return null;
    }
    const files = fs.readdirSync(directoryPath);
    const imageFile = files.find(file => /\.(jpe?g|png|gif|webp)$/i.test(file));
    if (imageFile) {
      return `/portfolio_images/${categoryDir.toLowerCase()}/${imageFile}`;
    }
    return null;
  } catch (error) {
    console.error(`Error reading preview directory ${categoryDir}:`, error);
    return null;
  }
};

export default async function Home() {
  const galleriesWithPreviews = galleries.map(gallery => ({
    ...gallery,
    previewImageSrc: getPreviewImageSrc(gallery.localDir),
  }));

  return (
    <div className="flex flex-col items-stretch min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      <ClientHero />
      <AnimatedPortfolio galleries={galleriesWithPreviews} />
    </div>
  );
} 