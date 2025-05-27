import { put, del, list } from '@vercel/blob';
import { Readable } from 'stream';

export interface BlobImage {
  url: string;
  pathname: string;
}

export const uploadToBlob = async (file: Buffer, pathname: string): Promise<BlobImage> => {
  try {
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return {
      url: blob.url,
      pathname: blob.pathname,
    };
  } catch (error) {
    console.error('Error uploading to blob storage:', error);
    throw error;
  }
};

export const deleteFromBlob = async (pathname: string): Promise<void> => {
  try {
    await del(pathname);
  } catch (error) {
    console.error('Error deleting from blob storage:', error);
    throw error;
  }
};

export const listBlobFiles = async (prefix: string): Promise<BlobImage[]> => {
  try {
    const { blobs } = await list({ prefix });
    return blobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
    }));
  } catch (error) {
    console.error('Error listing blob files:', error);
    throw error;
  }
};

export const bufferToStream = (buffer: Buffer): Readable => {
  return Readable.from(buffer);
}; 