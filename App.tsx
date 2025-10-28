
import React, { useState, useCallback } from 'react';
import { ColoringBookForm } from './components/ColoringBookForm';
import { ImageGrid } from './components/ImageGrid';
import { Spinner } from './components/Spinner';
import { generateColoringBookImages } from './services/geminiService';
import { createColoringBookPdf } from './services/pdfService';
import { Chatbot } from './components/Chatbot';
import { ChatIcon } from './components/icons';
import type { GeneratedImages, CoverOptions, ChildImage } from './types';

const App: React.FC = () => {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImages | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [email, setEmail] = useState('');
  const [emailMessage, setEmailMessage] = useState<string | null>(null);

  const handleGenerate = useCallback(async (formData: { 
    theme: string; 
    name: string; 
    ageLevel: string;
    coverOptions: CoverOptions;
    childImage: ChildImage | null;
  }) => {
    setIsLoading(true);
    setError(null);
    setGeneratedImages(null);
    setPdfUrl(null);
    setEmailMessage(null);
    setEmail('');

    try {
      const { theme, name, ageLevel, coverOptions, childImage } = formData;
      const images = await generateColoringBookImages(theme, name, ageLevel, coverOptions, childImage);
      setGeneratedImages(images);

      const url = await createColoringBookPdf(images.coverImage, images.pages, theme, name);
      setPdfUrl(url);
    } catch (e) {
      console.error(e);
      setError('Failed to generate coloring book. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMessage("For your security, browsers can't send files directly. Please download the PDF and attach it to your email.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 font-sans text-slate-800">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
            AI Coloring Book Generator
          </h1>
          <p className="mt-2 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Create a magical, personalized coloring book for your child in seconds.
          </p>
        </header>

        <div className="max-w-2xl mx-auto bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 md:p-8">
          <ColoringBookForm onSubmit={handleGenerate} isLoading={isLoading} />
        </div>

        {isLoading && (
          <div className="text-center mt-12">
            <Spinner />
            <p className="mt-4 text-slate-600 animate-pulse">Generating your magical coloring book... this can take a minute!</p>
          </div>
        )}

        {error && (
          <div className="text-center mt-8 max-w-xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
            <strong className="font-bold">Oops! </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {generatedImages && (
          <div className="mt-12">
             <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-700">Your Coloring Book is Ready!</h2>
                {pdfUrl && (
                    <a
                        href={pdfUrl}
                        download={`Coloring-Book-${generatedImages.name.replace(/\s+/g, '-')}.pdf`}
                        className="mt-4 inline-block bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out"
                    >
                        Download PDF
                    </a>
                )}
            </div>

            {pdfUrl && (
              <div className="max-w-xl mx-auto mt-8 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-slate-700 mb-4 text-center">Share via Email</h3>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter recipient's email"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                  >
                    Send Email
                  </button>
                </form>
                {emailMessage && (
                  <div className="mt-4 text-center text-sm text-blue-700 bg-blue-100 border border-blue-300 rounded-lg p-3">
                    {emailMessage}
                  </div>
                )}
              </div>
            )}

            <div className="mt-12">
              <ImageGrid coverImage={generatedImages.coverImage} pages={generatedImages.pages} />
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
