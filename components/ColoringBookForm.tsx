
import React, { useState } from 'react';
import { Spinner } from './Spinner';
import { TrashIcon } from './icons';
import type { CoverOptions, ChildImage } from '../types';

interface ColoringBookFormProps {
  onSubmit: (formData: {
    theme: string;
    name: string;
    ageLevel: string;
    coverOptions: CoverOptions;
    childImage: ChildImage | null;
  }) => void;
  isLoading: boolean;
}

export const ColoringBookForm: React.FC<ColoringBookFormProps> = ({ onSubmit, isLoading }) => {
  const [theme, setTheme] = useState('');
  const [name, setName] = useState('');
  const [ageLevel, setAgeLevel] = useState('kids');
  const [coverOptions, setCoverOptions] = useState<CoverOptions>({
    template: 'illustrated',
    color: '#8B5CF6', // purple-500
    font: 'playful',
    dedication: ''
  });
   const [childImage, setChildImage] = useState<ChildImage | null>(null);
   const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleCoverOptionsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCoverOptions(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setChildImage({ base64: base64String, mimeType: file.type });
        setImagePreview(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    }
     // Reset the input value to allow re-uploading the same file
    e.target.value = '';
  };

  const removeImage = () => {
    setChildImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (theme.trim() && name.trim() && !isLoading) {
      onSubmit({ theme, name, ageLevel, coverOptions, childImage });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* --- Main Details --- */}
      <fieldset>
        <legend className="text-lg font-semibold text-slate-800 mb-2 border-b pb-2">Book Details</legend>
        <div className="space-y-4 pt-2">
            <div>
                <label htmlFor="theme" className="block text-sm font-medium text-slate-700 mb-1">
                Coloring Book Theme
                </label>
                <input
                id="theme"
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g., Space Dinosaurs or Magical Forest"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition"
                required
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                    Child's Name
                    </label>
                    <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Lily"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition"
                    required
                    />
                </div>
                <div>
                    <label htmlFor="age" className="block text-sm font-medium text-slate-700 mb-1">
                    Age / Skill Level
                    </label>
                    <select
                        id="age"
                        value={ageLevel}
                        onChange={(e) => setAgeLevel(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition bg-white"
                    >
                        <option value="preschool">Preschool (2-4)</option>
                        <option value="kids">Kids (5-7)</option>
                        <option value="bigkids">Big Kids (8+)</option>
                    </select>
                </div>
            </div>
        </div>
      </fieldset>
      
      {/* --- Cover Customization --- */}
      <fieldset>
         <legend className="text-lg font-semibold text-slate-800 mb-2 border-b pb-2">Cover Customization</legend>
          <div className="space-y-4 pt-2">
            <div>
                <label htmlFor="template" className="block text-sm font-medium text-slate-700 mb-1">Cover Style</label>
                <select id="template" name="template" value={coverOptions.template} onChange={handleCoverOptionsChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition bg-white">
                    <option value="illustrated">Illustrated Storybook</option>
                    <option value="bold">Bold & Graphic</option>
                    <option value="soft">Soft & Whimsical</option>
                </select>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="font" className="block text-sm font-medium text-slate-700 mb-1">Font Style</label>
                    <select id="font" name="font" value={coverOptions.font} onChange={handleCoverOptionsChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition bg-white">
                        <option value="playful">Playful</option>
                        <option value="bold">Bold</option>
                        <option value="cursive">Cursive</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="color" className="block text-sm font-medium text-slate-700 mb-1">Title Color</label>
                    <input type="color" id="color" name="color" value={coverOptions.color} onChange={handleCoverOptionsChange} className="w-full h-10 px-1 py-1 border border-slate-300 rounded-lg" />
                </div>
             </div>
             <div>
                <label htmlFor="dedication" className="block text-sm font-medium text-slate-700 mb-1">Dedication (Optional)</label>
                <input id="dedication" name="dedication" type="text" value={coverOptions.dedication} onChange={handleCoverOptionsChange} placeholder="e.g., With love from Grandma" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition" />
             </div>
          </div>
      </fieldset>

       {/* --- Image Upload --- */}
       <fieldset>
        <legend className="text-lg font-semibold text-slate-800 mb-2 border-b pb-2">Personalize with a Photo (Optional)</legend>
        <div className="pt-2">
            {imagePreview ? (
                <div className="flex items-center space-x-4">
                    <img src={imagePreview} alt="Child preview" className="w-20 h-20 rounded-lg object-cover" />
                    <div className="text-sm">
                        <p className="font-medium text-slate-700">Image selected!</p>
                        <p className="text-slate-500">The AI will redraw this photo in the book.</p>
                    </div>
                    <button type="button" onClick={removeImage} className="ml-auto text-red-500 hover:text-red-700 p-2 rounded-full bg-red-100 hover:bg-red-200" aria-label="Remove image">
                        <TrashIcon />
                    </button>
                </div>
            ) : (
                <div className="w-full h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-center">
                    <label htmlFor="file-upload" className="cursor-pointer text-purple-600 hover:text-purple-800 font-semibold">
                       <span>Upload a photo</span>
                       <p className="text-xs text-slate-500">to add your child into the book!</p>
                       <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg" />
                    </label>
                </div>
            )}
        </div>
       </fieldset>

      <button
        type="submit"
        disabled={isLoading || !theme.trim() || !name.trim()}
        className="w-full flex justify-center items-center bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Spinner />
            <span className="ml-2">Creating...</span>
          </>
        ) : (
          'Generate My Coloring Book'
        )}
      </button>
    </form>
  );
};
