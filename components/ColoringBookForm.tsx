
import React, { useState } from 'react';
import { Spinner } from './Spinner';
import { TrashIcon } from './icons';
import type { GenerationFormData, ChildImage } from '../types';
import { storyCharacterRoles } from '../services/geminiService';


interface ColoringBookFormProps {
  onSubmit: (formData: GenerationFormData) => void;
  isLoading: boolean;
  mode: 'coloringBook' | 'stickerMaker' | 'storyTeller';
}

const defaultPrompts = [
    'Space Dinosaurs', 'Magical Forest Creatures', 'Underwater Unicorns',
    'Superhero Pets', 'Robots on Vacation', 'Enchanted Castle Adventure',
    'Pirate Animals Seeking Treasure', 'Fairies in a Candy Land', 'Friendly Monsters\' Party',
    'Construction Vehicles Building', 'Alien Zoo Planet', 'A Day at the Dragon Circus',
    'Jetpack-wearing Farm Animals', 'Gnomes in a Giant\'s Garden', 'Silly Knights and Princesses'
];

export const ColoringBookForm: React.FC<ColoringBookFormProps> = ({ onSubmit, isLoading, mode }) => {
  // Common state
  const [theme, setTheme] = useState('');
  const [childImage, setChildImage] = useState<ChildImage | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Coloring Book state
  const [name, setName] = useState('');
  const [ageLevel, setAgeLevel] = useState('kids');
  const [coverOptions, setCoverOptions] = useState({
    template: 'illustrated', color: '#8B5CF6', font: 'playful', dedication: ''
  });
  
  // Story Teller state
  const [storySelection, setStorySelection] = useState<keyof typeof storyCharacterRoles>('cinderella');
  const [character1Name, setCharacter1Name] = useState('');
  const [character2Name, setCharacter2Name] = useState('');
  const [character3Name, setCharacter3Name] = useState('');
  const [storybookMode, setStorybookMode] = useState<'classic' | 'personalized'>('classic');


  const handleCoverOptionsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCoverOptions(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleStoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStorySelection(e.target.value as keyof typeof storyCharacterRoles);
    setCharacter1Name('');
    setCharacter2Name('');
    setCharacter3Name('');
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
    if (isSubmitDisabled) return;
    
    if (mode === 'coloringBook') {
      onSubmit({ theme, name, ageLevel, coverOptions, childImage });
    } else if (mode === 'stickerMaker') {
      onSubmit({ theme, childImage });
    } else if (mode === 'storyTeller') {
        onSubmit({ theme: 'story', childImage, storySelection, character1Name, character2Name, character3Name, storybookMode });
    }
  };
  
  const isSubmitDisabled = isLoading || (mode !== 'storyTeller' && !theme.trim()) || 
    (mode === 'coloringBook' && !name.trim()) ||
    (mode === 'storyTeller' && !character1Name.trim());

  const getButtonText = () => {
      if (isLoading) return 'Creating...';
      switch(mode) {
          case 'coloringBook': return 'Generate My Coloring Book';
          case 'stickerMaker': return 'Create My Stickers';
          case 'storyTeller': return 'Write My Story';
          default: return 'Generate';
      }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* --- Mode-Specific Details --- */}
      {mode === 'coloringBook' && (
        <fieldset>
            <legend className="text-lg font-semibold text-slate-800 mb-2 border-b pb-2">Book Details</legend>
            <div className="space-y-4 pt-2">
                <div>
                    <label htmlFor="theme" className="block text-sm font-medium text-slate-700 mb-1">Coloring Book Theme</label>
                    <input id="theme" type="text" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="e.g., Space Dinosaurs" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition" required/>
                </div>
                <div>
                    <p className="text-xs font-medium text-slate-600 mb-2">Need ideas? Try one of these!</p>
                    <div className="flex flex-wrap gap-2">
                        {defaultPrompts.map(prompt => (
                            <button key={prompt} type="button" onClick={() => setTheme(prompt)} className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 transition-colors">{prompt}</button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Child's Name</label>
                        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Lily" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition" required/>
                    </div>
                    <div>
                        <label htmlFor="age" className="block text-sm font-medium text-slate-700 mb-1">Age / Skill Level</label>
                        <select id="age" value={ageLevel} onChange={(e) => setAgeLevel(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition bg-white">
                            <option value="preschool">Preschool (2-4)</option>
                            <option value="kids">Kids (5-7)</option>
                            <option value="bigkids">Big Kids (8+)</option>
                        </select>
                    </div>
                </div>
            </div>
        </fieldset>
      )}

      {mode === 'stickerMaker' && (
        <fieldset>
            <legend className="text-lg font-semibold text-slate-800 mb-2 border-b pb-2">Sticker Details</legend>
            <div className="space-y-4 pt-2">
                <div>
                    <label htmlFor="theme" className="block text-sm font-medium text-slate-700 mb-1">Sticker Theme</label>
                    <input id="theme" type="text" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="e.g., Happy Avocados" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition" required/>
                </div>
                 <div>
                    <p className="text-xs font-medium text-slate-600 mb-2">Need ideas? Try one of these!</p>
                    <div className="flex flex-wrap gap-2">
                        {defaultPrompts.slice(0, 5).map(prompt => (
                            <button key={prompt} type="button" onClick={() => setTheme(prompt)} className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 transition-colors">{prompt}</button>
                        ))}
                    </div>
                </div>
            </div>
        </fieldset>
      )}

      {mode === 'storyTeller' && (
        <fieldset>
            <legend className="text-lg font-semibold text-slate-800 mb-2 border-b pb-2">Story Details</legend>
            <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Story Mode</label>
                  <div className="flex rounded-lg border border-slate-300 p-0.5 w-full">
                    <button type="button" onClick={() => setStorybookMode('classic')} className={`w-1/2 py-2 text-sm rounded-md transition-colors ${storybookMode === 'classic' ? 'bg-purple-500 text-white' : 'hover:bg-slate-100'}`}>
                      Classic (Fast)
                    </button>
                    <button type="button" onClick={() => setStorybookMode('personalized')} className={`w-1/2 py-2 text-sm rounded-md transition-colors ${storybookMode === 'personalized' ? 'bg-purple-500 text-white' : 'hover:bg-slate-100'}`}>
                      Personalized AI
                    </button>
                  </div>
                   <p className="text-xs text-slate-500 mt-1 text-center">{storybookMode === 'classic' ? 'Uses beautiful pre-made illustrations.' : 'Generates unique new illustrations with AI.'}</p>
                </div>
                <div>
                    <label htmlFor="storySelection" className="block text-sm font-medium text-slate-700 mb-1">Choose a Classic Story</label>
                    <select id="storySelection" value={storySelection} onChange={handleStoryChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition bg-white">
                        <option value="cinderella">Cinderella</option>
                        <option value="snow_white">Snow White</option>
                        <option value="jack_beanstalk">Jack and the Beanstalk</option>
                        <option value="three_pigs">The Three Little Pigs</option>
                        <option value="goldilocks">Goldilocks &amp; the Three Bears</option>
                        <option value="red_riding_hood">Little Red Riding Hood</option>
                    </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="character1Name" className="block text-sm font-medium text-slate-700 mb-1">Main Character's Name</label>
                        <input id="character1Name" type="text" value={character1Name} onChange={(e) => setCharacter1Name(e.target.value)} placeholder={storyCharacterRoles[storySelection].originalChar1} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition" required/>
                    </div>
                     <div>
                        <label htmlFor="character2Name" className="block text-sm font-medium text-slate-700 mb-1">Second Character (Optional)</label>
                        <input id="character2Name" type="text" value={character2Name} onChange={(e) => setCharacter2Name(e.target.value)} placeholder={storyCharacterRoles[storySelection].originalChar2} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition"/>
                    </div>
                </div>
                 <div>
                    <label htmlFor="character3Name" className="block text-sm font-medium text-slate-700 mb-1">{storyCharacterRoles[storySelection].char3Role} (Optional)</label>
                    <input id="character3Name" type="text" value={character3Name} onChange={(e) => setCharacter3Name(e.target.value)} placeholder={storyCharacterRoles[storySelection].originalChar3} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition"/>
                </div>
            </div>
        </fieldset>
      )}

      {/* --- Common Details --- */}
      {(mode === 'coloringBook' || mode === 'stickerMaker' || (mode === 'storyTeller' && storybookMode === 'personalized')) && (
        <fieldset>
            <legend className="text-lg font-semibold text-slate-800 mb-2 border-b pb-2">Personalize (Optional)</legend>
            <div className="space-y-4 pt-2">
                <p className="text-sm text-slate-600">Upload a photo to have the AI draw a character based on your child!</p>
                {imagePreview ? (
                <div className="relative group w-32 h-32 mx-auto">
                    <img src={imagePreview} alt="Child preview" className="w-32 h-32 rounded-lg object-cover shadow-md" />
                    <button type="button" onClick={removeImage} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TrashIcon />
                    </button>
                </div>
                ) : (
                <div>
                    <label htmlFor="file-upload" className="cursor-pointer w-full flex justify-center px-4 py-6 border-2 border-slate-300 border-dashed rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition">
                        <span>Click to upload a photo</span>
                    </label>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg" />
                </div>
                )}
            </div>
        </fieldset>
      )}

      {mode === 'coloringBook' && (
         <fieldset>
            <legend className="text-lg font-semibold text-slate-800 mb-2 border-b pb-2">Cover Customization</legend>
            <div className="space-y-4 pt-2">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="template" className="block text-sm font-medium text-slate-700 mb-1">Cover Template</label>
                        <select name="template" id="template" value={coverOptions.template} onChange={handleCoverOptionsChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition bg-white">
                            <option value="illustrated">Illustrated</option>
                            <option value="bold">Bold & Graphic</option>
                            <option value="soft">Soft & Whimsical</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="font" className="block text-sm font-medium text-slate-700 mb-1">Font Style</label>
                        <select name="font" id="font" value={coverOptions.font} onChange={handleCoverOptionsChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition bg-white">
                            <option value="playful">Playful</option>
                            <option value="bold">Bold</option>
                            <option value="cursive">Cursive</option>
                        </select>
                    </div>
                 </div>
                 <div>
                    <label htmlFor="color" className="block text-sm font-medium text-slate-700 mb-1">Title Color</label>
                    <input type="color" name="color" id="color" value={coverOptions.color} onChange={handleCoverOptionsChange} className="w-full h-10 p-1 border border-slate-300 rounded-lg cursor-pointer" />
                 </div>
                 <div>
                    <label htmlFor="dedication" className="block text-sm font-medium text-slate-700 mb-1">Dedication (Optional)</label>
                    <input type="text" name="dedication" id="dedication" value={coverOptions.dedication} onChange={handleCoverOptionsChange} placeholder="e.g., With love from Grandma" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition" />
                 </div>
            </div>
        </fieldset>
      )}


      {/* --- Submit Button --- */}
      <div className="pt-4">
        <button type="submit" disabled={isSubmitDisabled} className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
          {isLoading && <Spinner className="h-5 w-5" />}
          {getButtonText()}
        </button>
      </div>
    </form>
  );
};