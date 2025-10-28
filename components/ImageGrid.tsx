
import React from 'react';

interface ImageGridProps {
  coverImage: string;
  pages: string[];
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


export const ImageGrid: React.FC<ImageGridProps> = ({ coverImage, pages }) => {
  const allImages = [coverImage, ...pages];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {allImages.map((imgSrc, index) => (
        <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
          <img src={imgSrc} alt={`Coloring page ${index + 1}`} className="w-full h-auto aspect-square object-contain p-2"/>
          <div className="p-3 bg-slate-50 text-center">
             <p className="text-sm font-semibold text-slate-600">{PAGE_LABELS[index] || `Page ${index + 1}`}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
