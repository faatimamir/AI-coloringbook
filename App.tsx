
import React, { useState, useCallback } from 'react';
import { ColoringBookForm } from './components/ColoringBookForm';
import { ImageGrid } from './components/ImageGrid';
import { Spinner } from './components/Spinner';
import { generateColoringBookImages, generateStickers, generatePersonalizedStory } from './services/geminiService';
import { createColoringBookPdf, createStickerSheetPdf, createStickersZip, createStoryPdf } from './services/pdfService';
import { Chatbot } from './components/Chatbot';
import { ChatIcon } from './components/icons';
import type { GeneratedImages, GenerationFormData } from './types';

type Mode = 'coloringBook' | 'stickerMaker' | 'storyTeller';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('coloringBook');
  // Coloring Book State
  const [generatedImages, setGeneratedImages] = useState<GeneratedImages | null>(null);
  const [coloringBookPdfUrl, setColoringBookPdfUrl] = useState<string | null>(null);
  // Sticker Maker State
  const [stickerImages, setStickerImages] = useState<string[] | null>(null);
  const [stickerPdfUrl, setStickerPdfUrl] = useState<string | null>(null);
  const [isZipLoading, setIsZipLoading] = useState<boolean>(false);
  // Story Teller State
  const [storyText, setStoryText] = useState<string | null>(null);
  const [storyPdfUrl, setStoryPdfUrl] = useState<string | null>(null);
  // General State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  const handleGenerate = useCallback(async (formData: GenerationFormData) => {
    setIsLoading(true);
    setError(null);
    resetState(true); // Soft reset
    setLoadingMessage('Warming up the AI...');
    setProgress(0);

    try {
      if (mode === 'coloringBook' && formData.name && formData.ageLevel && formData.coverOptions) {
        const { theme, name, ageLevel, coverOptions, childImage } = formData;
        const images = await generateColoringBookImages(
          theme, name, ageLevel, coverOptions, childImage, 
          (message, percent) => { setLoadingMessage(message); setProgress(percent); }
        );
        setGeneratedImages(images);
        const url = await createColoringBookPdf(images.coverImage, images.pages, theme, name);
        setColoringBookPdfUrl(url);
      } else if (mode === 'stickerMaker') {
        const { theme, childImage } = formData;
        const stickers = await generateStickers(
          theme, childImage,
          (message, percent) => { setLoadingMessage(message); setProgress(percent); }
        );
        setStickerImages(stickers);
        const pdfUrl = await createStickerSheetPdf(stickers);
        setStickerPdfUrl(pdfUrl);
      } else if (mode === 'storyTeller' && formData.storySelection && formData.character1Name) {
         setLoadingMessage('Weaving a magical tale...');
         setProgress(33);
         const { storySelection, character1Name, character2Name, character3Name } = formData;
         const story = await generatePersonalizedStory(storySelection, character1Name, character2Name || '', character3Name || '');
         setStoryText(story);
         setProgress(66);
         setLoadingMessage('Formatting your beautiful storybook...');
         const storyPdf = await createStoryPdf(story, storySelection, { character1Name, character2Name, character3Name });
         setStoryPdfUrl(storyPdf);
         setProgress(100);
         setLoadingMessage('Your story is ready!');
      }
    } catch (e) {
      console.error(e);
      setError(`Failed to generate ${mode.replace(/([A-Z])/g, ' $1')}. Please try again.`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      // Don't reset progress to 0 immediately to show completion
    }
  }, [mode]);

  const resetState = (keepProgress = false) => {
    setGeneratedImages(null);
    setColoringBookPdfUrl(null);
    setStickerImages(null);
    setStickerPdfUrl(null);
    setStoryText(null);
    setStoryPdfUrl(null);
    setError(null);
    if (!keepProgress) {
        setProgress(0);
    }
  }

  const handleModeChange = (newMode: Mode) => {
    if (newMode !== mode) {
        setMode(newMode);
        resetState();
    }
  }

  const handleDownloadZip = async () => {
    if (!stickerImages) return;
    setIsZipLoading(true);
    try {
      await createStickersZip(stickerImages);
    } catch(e) {
      console.error("Failed to create ZIP", e);
      setError("Could not create ZIP file.");
    } finally {
      setIsZipLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 font-sans text-slate-800">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
            AI Creative Studio
          </h1>
          <p className="mt-2 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Create magical coloring books, vibrant stickers, or personalized stories in seconds.
          </p>
        </header>

        <div className="max-w-2xl mx-auto">
          {/* Mode Tabs */}
          <div className="flex justify-center border-b-2 border-slate-200 mb-8">
            <button 
              onClick={() => handleModeChange('coloringBook')}
              className={`px-4 sm:px-6 py-3 font-semibold text-base sm:text-lg transition-colors duration-300 ${mode === 'coloringBook' ? 'text-purple-600 border-b-4 border-purple-500' : 'text-slate-500 hover:text-purple-500'}`}
            >
              Coloring Book
            </button>
            <button 
              onClick={() => handleModeChange('stickerMaker')}
              className={`px-4 sm:px-6 py-3 font-semibold text-base sm:text-lg transition-colors duration-300 ${mode === 'stickerMaker' ? 'text-purple-600 border-b-4 border-purple-500' : 'text-slate-500 hover:text-purple-500'}`}
            >
              Sticker Maker
            </button>
            <button 
              onClick={() => handleModeChange('storyTeller')}
              className={`px-4 sm:px-6 py-3 font-semibold text-base sm:text-lg transition-colors duration-300 ${mode === 'storyTeller' ? 'text-purple-600 border-b-4 border-purple-500' : 'text-slate-500 hover:text-purple-500'}`}
            >
              Story Teller
            </button>
          </div>
        
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 md:p-8">
            <ColoringBookForm onSubmit={handleGenerate} isLoading={isLoading} mode={mode} />
          </div>
        </div>

        {isLoading && (
          <div className="text-center mt-12 flex flex-col items-center justify-center">
            <Spinner className="h-10 w-10 text-purple-500" />
            <p className="mt-4 text-slate-600">{loadingMessage}</p>
            <div className="w-full max-w-md bg-slate-200 rounded-full h-2.5 mt-4 overflow-hidden">
                <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-500 ease-linear" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center mt-8 max-w-xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
            <strong className="font-bold">Oops! </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {mode === 'coloringBook' && generatedImages && (
          <div className="mt-12">
             <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-700">Your Coloring Book is Ready!</h2>
                {coloringBookPdfUrl && (
                    <a
                        href={coloringBookPdfUrl}
                        download={`Coloring-Book-${generatedImages.name.replace(/\s+/g, '-')}.pdf`}
                        className="mt-4 inline-block bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out"
                    >
                        Download PDF
                    </a>
                )}
            </div>
            <div className="mt-12">
              <ImageGrid mode="coloringBook" coverImage={generatedImages.coverImage} pages={generatedImages.pages} />
            </div>
          </div>
        )}

        {mode === 'stickerMaker' && stickerImages && (
          <div className="mt-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-700">Your Stickers are Ready!</h2>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {stickerPdfUrl && (
                      <a
                          href={stickerPdfUrl}
                          download="Sticker-Sheet.pdf"
                          className="inline-block bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out"
                      >
                          Download Sticker Sheet (PDF)
                      </a>
                  )}
                  <button
                    onClick={handleDownloadZip}
                    disabled={isZipLoading}
                    className="inline-block bg-gradient-to-r from-purple-400 to-indigo-500 hover:from-purple-500 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out disabled:opacity-50"
                  >
                    {isZipLoading ? 'Zipping...' : 'Download All as ZIP'}
                  </button>
              </div>
            </div>
            <div className="mt-12">
              <ImageGrid mode="stickerMaker" stickers={stickerImages} />
            </div>
          </div>
        )}
        
        {mode === 'storyTeller' && storyText && (
          <div className="mt-12 max-w-2xl mx-auto">
             <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-700">Your Personalized Storybook is Ready!</h2>
                 <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {storyPdfUrl && (
                        <a
                            href={storyPdfUrl}
                            download="My-Personalized-Story.pdf"
                            className="inline-block bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out"
                        >
                            Download Story PDF
                        </a>
                    )}
                 </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 md:p-8 whitespace-pre-wrap font-serif text-base leading-relaxed text-slate-700 max-h-[40vh] overflow-y-auto border">
              <h3 className="text-xl font-bold font-sans mb-4 text-center">Story Preview</h3>
              <p>{storyText.substring(0, 400)}...</p>
            </div>
          </div>
        )}
      </main>
      
      <button 
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-full shadow-xl hover:scale-110 transform transition-transform duration-300"
        aria-label="Open Chat"
      >
        <ChatIcon />
      </button>

      <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default App;
