import { useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PortfolioImage } from './types';
import { FaDownload } from 'react-icons/fa';

interface ImageModalProps {
  image: PortfolioImage;
  onClose: () => void;
  onDownload?: (image: PortfolioImage) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2, ease: "easeInOut" } },
};

const ImageModal = ({ image, onClose, onDownload, onNext, onPrevious, hasNext, hasPrevious }: ImageModalProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'ArrowRight' && hasNext && onNext) {
        onNext();
      }
      if (e.key === 'ArrowLeft' && hasPrevious && onPrevious) {
        onPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onNext, onPrevious, hasNext, hasPrevious]);

  if (!image) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      onClick={(e) => {
        // Close only if the click is on the backdrop, not on the buttons
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Image preview: ${image.name}`}
      tabIndex={-1}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={modalVariants}
    >
      {/* Image Name Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-black bg-opacity-50 rounded-lg text-white text-sm">
        {image.name}
      </div>

      {/* Previous Button */}
      {hasPrevious && onPrevious && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrevious(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 px-3 py-6 bg-black bg-opacity-30 rounded-full text-white hover:bg-opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Previous image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}

      <div 
        className="relative w-full h-5/6 max-w-5xl max-h-5/6 flex items-center justify-center p-4 cursor-pointer"
        onContextMenu={(e) => e.preventDefault()}
        onClick={(e) => { 
          e.stopPropagation(); // Prevent click from bubbling to the main backdrop div's onClick
          onClose(); 
        }}
      >
        <Image
          src={image.src}
          alt={image.name}
          fill
          className="object-contain select-none"
          priority
          style={{ WebkitTouchCallout: 'none' } as React.CSSProperties}
        />
      </div>

      {/* Next Button */}
      {hasNext && onNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 px-3 py-6 bg-black bg-opacity-30 rounded-full text-white hover:bg-opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Next image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}

      {/* Close Button (Top Right) */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
        {/* Download Button (Conditionally Rendered) */}
        {onDownload && (
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(image); }}
            className="p-3 bg-LBPBlue/80 text-white rounded-full hover:bg-LBPBlue transition-all focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Download image"
          >
            <FaDownload />
          </button>
        )}

        {/* Close Button (Top Right) */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="p-3 bg-black/30 text-white rounded-full hover:bg-black/50 transition-all focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close image preview"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

    </motion.div>
  );
};

export default ImageModal; 