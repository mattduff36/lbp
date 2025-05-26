export interface GalleryConfig {
  name: string;
  path: string;
  localDir: string; // This is the category identifier for syncPortfolio and blob storage prefix
}

export const GALLERIES: GalleryConfig[] = [
  { name: 'Wedding', path: '/portfolio/wedding', localDir: 'wedding' },
  { name: 'Portrait', path: '/portfolio/portrait', localDir: 'portrait' },
  { name: 'Lifestyle', path: '/portfolio/lifestyle', localDir: 'lifestyle' },
  { name: 'Landscape', path: '/portfolio/landscape', localDir: 'landscape' },
  { name: 'Animals', path: '/portfolio/animals', localDir: 'animals' },
  { name: 'Sport', path: '/portfolio/sport', localDir: 'sport' },
]; 