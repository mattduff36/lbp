import ClientHero from './components/ClientHero';
import GalleryPreview from './components/GalleryPreview';
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
      // console.warn(`Preview directory not found: ${directoryPath}`);
      return null;
    }
    const files = fs.readdirSync(directoryPath);
    // Filter for common image extensions and pick the first one
    const imageFile = files.find(file => /\.(jpe?g|png|gif|webp)$/i.test(file));
    if (imageFile) {
      return `/portfolio_images/${categoryDir.toLowerCase()}/${imageFile}`;
    }
    // console.warn(`No image found in preview directory: ${directoryPath}`);
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
    <div className="flex flex-col items-stretch">
      <ClientHero />
      <section id="portfolio" className="py-16 w-full bg-black">
        <div className="w-full px-8">
          <h2 className="text-3xl font-medium text-gray-300 tracking-wider uppercase font-montserrat text-center mb-12">
            Portfolio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {galleriesWithPreviews.map((gallery) => (
              <GalleryPreview
                key={gallery.path}
                name={gallery.name}
                path={gallery.path}
                previewImageSrc={gallery.previewImageSrc}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
} 