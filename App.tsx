
import React, { useState, useCallback, useEffect } from 'react';
import { ColoringBookForm } from './components/ColoringBookForm.tsx';
import { ImageGrid } from './components/ImageGrid.tsx';
import { Spinner } from './components/Spinner.tsx';
import { createColoringBookPdf, createStickerSheetPdf, createStickersZip, createStoryPdf } from './services/pdfService.ts';
import { Chatbot } from './components/Chatbot.tsx';
import { ChatIcon, PaintBrushIcon, StickerIcon, BookIcon } from './components/icons.tsx';
import type { GeneratedImages, GenerationFormData, StorybookContent } from './types.ts';

type Mode = 'coloringBook' | 'stickerMaker' | 'storyTeller';

// --- Welcome Modal Component ---
interface WelcomeModalProps {
  onClose: () => void;
}
const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-lg w-full transform animate-scale-in">
        <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-4">
          Welcome to the Studio!
        </h2>
        <p className="text-center text-slate-600 mb-8">
          Your creative workshop for magic and wonder. Let's build something beautiful together!
        </p>

        <div className="grid grid-cols-3 gap-4 text-center mb-8">
          <div className="flex flex-col items-center">
            <div className="bg-purple-100 p-3 rounded-full mb-2"><PaintBrushIcon /></div>
            <p className="text-xs font-semibold">Books</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-pink-100 p-3 rounded-full mb-2"><StickerIcon /></div>
            <p className="text-xs font-semibold">Stickers</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-blue-100 p-3 rounded-full mb-2"><BookIcon /></div>
            <p className="text-xs font-semibold">Stories</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95"
        >
          Let's Start!
        </button>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('coloringBook');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImages | null>(null);
  const [coloringBookPdfUrl, setColoringBookPdfUrl] = useState<string | null>(null);
  const [stickerImages, setStickerImages] = useState<string[] | null>(null);
  const [stickerPdfUrl, setStickerPdfUrl] = useState<string | null>(null);
  const [isZipLoading, setIsZipLoading] = useState<boolean>(false);
  const [storybookContent, setStorybookContent] = useState<StorybookContent | null>(null);
  const [storyPdfUrl, setStoryPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(false);

  // Check for API key in standard and window locations
  const apiKey = process.env.API_KEY || (window as any).process?.env?.API_KEY;

  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setIsWelcomeModalOpen(true);
    }
  }, []);

  const handleCloseWelcomeModal = () => {
    sessionStorage.setItem('hasSeenWelcome', 'true');
    setIsWelcomeModalOpen(false);
  };

  const handleGenerate = useCallback(async (formData: GenerationFormData) => {
    if (!apiKey) {
        setError("Missing API Key. Please configure the environment variable to continue.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages(null);
    setStickerImages(null);
    setStorybookContent(null);
    setLoadingMessage('Initializing creative engine...');
    setProgress(5);

    try {
      const { generateColoringBookImages, generateStickers, generatePersonalizedStorybook } = await import('./services/geminiService.ts');

      if (mode === 'coloringBook') {
        const images = await generateColoringBookImages(
          formData.theme, formData.name || 'Friend', formData.ageLevel || 'kids', formData.coverOptions!, formData.childImage, 
          (msg, p) => { setLoadingMessage(msg); setProgress(p); }
        );
        setGeneratedImages(images);
        const url = await createColoringBookPdf(images.coverImage, images.pages, images.theme, images.name);
        setColoringBookPdfUrl(url);
      } else if (mode === 'stickerMaker') {
        const stickers = await generateStickers(
          formData.theme, formData.childImage,
          (msg, p) => { setLoadingMessage(msg); setProgress(p); }
        );
        setStickerImages(stickers);
        const pdfUrl = await createStickerSheetPdf(stickers);
        setStickerPdfUrl(pdfUrl);
      } else if (mode === 'storyTeller') {
         const storybook = await generatePersonalizedStorybook(
            formData.storySelection!, formData.character1Name!, formData.character2Name || '', formData.character3Name || '',
            formData.storybookMode!, formData.childImage,
            (msg, p) => { setLoadingMessage(msg); setProgress(p); }
        );
         setStorybookContent(storybook);
         const storyPdf = await createStoryPdf(storybook);
         setStoryPdfUrl(storyPdf);
      }
      setProgress(100);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Something went wrong in the workshop!");
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [mode, apiKey]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
    setProgress(0);
  }

  // --- Early return for missing API key configuration ---
  if (!apiKey && !isLoading && !error) {
     return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full border border-slate-200 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-amber-600 text-3xl font-bold">!</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Setup Required</h1>
                <p className="text-slate-600 mb-8">
                    To use the AI Creative Studio, you need to add your <strong>Gemini API Key</strong> to your environment variables.
                </p>
                <div className="bg-slate-50 p-4 rounded-xl text-left mb-6 font-mono text-sm border border-slate-100">
                    <p className="text-slate-400 mb-1">// vercel.json / .env</p>
                    <p className="text-purple-600">API_KEY=your_key_here</p>
                </div>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block w-full py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 transition-colors mb-4"
                >
                  Get API Key
                </a>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {isWelcomeModalOpen && <WelcomeModal onClose={handleCloseWelcomeModal} />}
      
      <nav className="p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-lg shadow-md flex items-center justify-center text-white font-black italic">AS</div>
            <span className="font-bold text-slate-800 text-xl tracking-tight hidden sm:block">Creative Studio</span>
          </div>
          <div className="flex bg-white/50 backdrop-blur p-1 rounded-xl shadow-sm border border-white/50">
            <button onClick={() => handleModeChange('coloringBook')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'coloringBook' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}>Books</button>
            <button onClick={() => handleModeChange('stickerMaker')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'stickerMaker' ? 'bg-white shadow-sm text-pink-600' : 'text-slate-500 hover:text-slate-700'}`}>Stickers</button>
            <button onClick={() => handleModeChange('storyTeller')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'storyTeller' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Stories</button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pb-20 pt-4">
        <div className="max-w-2xl mx-auto space-y-12">
          <section className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/50">
            <ColoringBookForm onSubmit={handleGenerate} isLoading={isLoading} mode={mode} />
          </section>

          {isLoading && (
            <div className="flex flex-col items-center gap-4 animate-fade-in">
              <Spinner className="w-10 h-10 text-purple-500" />
              <div className="text-center">
                <p className="font-medium text-slate-700">{loadingMessage}</p>
                <div className="w-48 h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-center font-medium animate-fade-in">
              {error}
            </div>
          )}

          {generatedImages && mode === 'coloringBook' && (
            <div className="space-y-8 animate-scale-in">
              <div className="flex justify-between items-end">
                <h2 className="text-2xl font-bold text-slate-800">Your Book</h2>
                {coloringBookPdfUrl && (
                  <a href={coloringBookPdfUrl} download="My-Coloring-Book.pdf" className="px-6 py-2 bg-green-500 text-white rounded-xl font-bold shadow-lg hover:bg-green-600 transition-colors">Download PDF</a>
                )}
              </div>
              <ImageGrid mode="coloringBook" coverImage={generatedImages.coverImage} pages={generatedImages.pages} />
            </div>
          )}

          {stickerImages && mode === 'stickerMaker' && (
            <div className="space-y-8 animate-scale-in">
              <div className="flex flex-wrap justify-between items-end gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Your Stickers</h2>
                <div className="flex gap-2">
                  <button onClick={() => createStickersZip(stickerImages)} className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold shadow-lg hover:bg-slate-900 transition-colors">Save All</button>
                  {stickerPdfUrl && <a href={stickerPdfUrl} download="Stickers.pdf" className="px-6 py-2 bg-pink-500 text-white rounded-xl font-bold shadow-lg hover:bg-pink-600 transition-colors">PDF Sheet</a>}
                </div>
              </div>
              <ImageGrid mode="stickerMaker" stickers={stickerImages} />
            </div>
          )}

          {storybookContent && mode === 'storyTeller' && (
            <div className="space-y-8 animate-scale-in">
              <div className="flex justify-between items-end">
                <h2 className="text-2xl font-bold text-slate-800">Your Story</h2>
                {storyPdfUrl && <a href={storyPdfUrl} download="Story.pdf" className="px-6 py-2 bg-blue-500 text-white rounded-xl font-bold shadow-lg hover:bg-blue-600 transition-colors">Download Book</a>}
              </div>
              <div className="bg-white rounded-3xl p-4 shadow-xl border border-slate-100">
                <img src={storybookContent.coverImage} alt="Cover" className="w-full rounded-2xl shadow-sm" />
                <h3 className="text-xl font-bold text-center mt-6 text-slate-800">{storybookContent.title}</h3>
              </div>
            </div>
          )}
        </div>
      </main>

      <button 
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
      >
        <ChatIcon />
      </button>

      <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default App;
