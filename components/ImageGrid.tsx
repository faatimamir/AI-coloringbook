
import React from 'react';

interface ImageGridProps {
  mode: 'coloringBook' | 'stickerMaker';
  coverImage?: string;
  pages?: string[];
  stickers?: string[];
}

const PAGE_LABELS = [
    'Custom Cover',
    'Personalized Character',
    'Fun Scene',
    'Amazing Maze',
    'Connect the Dots',
    'Find the Items',
    'Name Tracing',
    'Fun Pattern',
    'Coloring Award'
];


export const ImageGrid: React.FC<ImageGridProps> = ({ mode, coverImage, pages = [], stickers = [] }) => {
  if (mode === 'coloringBook' && coverImage) {
    const allImages = [coverImage, ...pages];
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {allImages.map((imgSrc, index) => (
          <div key={`page-${index}`} className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
            <img src={imgSrc} alt={`Coloring page ${index + 1}`} className="w-full h-auto aspect-square object-contain p-2"/>
            <div className="p-3 bg-slate-50 text-center">
               <p className="text-sm font-semibold text-slate-600">{PAGE_LABELS[index] || `Page ${index + 1}`}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (mode === 'stickerMaker') {
    return (
       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-6 md:gap-8">
        {stickers.map((imgSrc, index) => (
          <div key={`sticker-${index}`} className="transform hover:scale-110 transition-transform duration-300 flex items-center justify-center">
            <img 
              src={imgSrc} 
              alt={`Sticker ${index + 1}`} 
              className="max-w-full h-auto object-contain"
              style={{ filter: 'drop-shadow(0px 5px 10px rgba(0,0,0,0.2))' }}
            />
          </div>
        ))}
      </div>
    );
  }

  return null;
};
