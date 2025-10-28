
import React, { useState, useRef, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { startChat, sendMessageToBot } from '../services/geminiService';
import type { ChatMessage } from '../types';
import { CloseIcon, SendIcon } from './icons';

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const chatInstance = startChat();
      setChat(chatInstance);
      setMessages([{ role: 'model', text: 'Hello! How can I help you today?' }]);
    } else {
      setMessages([]);
      setUserInput('');
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !chat || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: userInput };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await sendMessageToBot(chat, userInput);
      const modelMessage: ChatMessage = { role: 'model', text: response };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = { role: 'model', text: "Sorry, I'm having trouble connecting. Please try again." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-8 sm:right-8 w-full h-full sm:w-96 sm:h-[600px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
      <header className="flex items-center justify-between p-4 border-b bg-slate-50 rounded-t-2xl">
        <h2 className="text-lg font-bold text-slate-800">AI Assistant</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
          <CloseIcon />
        </button>
      </header>

      <div className="flex-1 p-4 overflow-y-auto bg-slate-100">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-purple-500 text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-sm px-4 py-3 rounded-2xl bg-slate-200 text-slate-800 rounded-bl-none">
                <div className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="p-4 border-t bg-white rounded-b-2xl">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-full focus:ring-purple-500 focus:border-purple-500 transition"
            disabled={isLoading}
          />
          <button type="submit" className="bg-purple-500 text-white p-2.5 rounded-full hover:bg-purple-600 disabled:bg-purple-300 transition-colors" disabled={isLoading || !userInput.trim()}>
            <SendIcon />
          </button>
        </form>
      </footer>
    </div>
  );
};
