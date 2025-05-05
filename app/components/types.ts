export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface HeroImage {
  id: number;
  src: string;
  alt: string;
}

export interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  category: string;
  description?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
} 