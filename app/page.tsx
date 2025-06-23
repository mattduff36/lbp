import ClientHero from './components/ClientHero';
import AnimatedPortfolio from './components/AnimatedPortfolio';
import path from 'path';
import { GALLERIES } from '@/app/config/galleries';
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });
const PORTFOLIO_ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

const getPreviewImageSrc = async (categoryDir: string): Promise<string | null> => {
  if (!PORTFOLIO_ROOT_FOLDER_ID) {
    console.error('getPreviewImageSrc: GOOGLE_DRIVE_FOLDER_ID is not set.');
    return null;
  }

  try {
    const categoryLower = categoryDir.toLowerCase();
    
    const folderResponse = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${categoryLower}' and '${PORTFOLIO_ROOT_FOLDER_ID}' in parents`,
      fields: 'files(id)',
      pageSize: 1,
    });

    const categoryFolder = folderResponse.data.files?.[0];

    if (!categoryFolder || !categoryFolder.id) {
      console.warn(`getPreviewImageSrc: Category folder '${categoryDir}' not found.`);
      return null;
    }

    const imagesResponse = await drive.files.list({
      q: `'${categoryFolder.id}' in parents and mimeType contains 'image/'`,
      fields: 'files(webContentLink)',
      pageSize: 1,
      orderBy: 'createdTime desc', 
    });

    const firstImage = imagesResponse.data.files?.[0];
    
    if (!firstImage || !firstImage.webContentLink) {
      console.warn(`getPreviewImageSrc: No images found in category folder '${categoryDir}'.`);
      return null;
    }

    return firstImage.webContentLink;

  } catch (error) {
    console.error(`getPreviewImageSrc: Error fetching preview for ${categoryDir}:`, error);
    return null;
  }
};

export default async function Home() {
  const galleriesWithPreviewsPromises = GALLERIES.map(async (gallery) => ({
    ...gallery,
    previewImageSrc: await getPreviewImageSrc(gallery.localDir),
  }));

  const galleriesWithPreviews = await Promise.all(galleriesWithPreviewsPromises);
  console.log("Galleries with previews for Home page:", galleriesWithPreviews);

  return (
    <div className="flex flex-col items-stretch min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      <ClientHero />
      <AnimatedPortfolio galleries={galleriesWithPreviews} />
    </div>
  );
} 