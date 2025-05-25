import { useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ImageModalProps {
  image: {
    src: string;
    name: string;
  };
  onClose: () => void;
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2, ease: "easeInOut" } },
};

const ImageModal = ({ image, onClose }: ImageModalProps) => {
  return (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center cursor-pointer"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Image preview: ${image.name}`}
      tabIndex={-1}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={modalVariants}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <Image
          src={image.src}
          alt={image.name}
          fill
          className="object-contain"
          priority
        />
      </div>
    </motion.div>
  );
};

export default ImageModal; 