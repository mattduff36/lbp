export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface HeroImage {
  id: number;
  src: string;
  alt: string;
}

export interface PortfolioImage {
  id: string;
  src: string;
  name: string;
  category: string;
  width?: number;
  height?: number;
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
