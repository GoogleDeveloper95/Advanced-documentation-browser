/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
// FIX: Removed unused User type after refactoring API key handling.
import { ChatMessage, MessageSender, URLGroup, FileContext, Book } from '@/types';
import { generateContentWithUrlContext, getInitialSuggestions, editImage, generateImage, generateBook } from '@/services/geminiService';
import KnowledgeBaseManager from '@/components/KnowledgeBaseManager';
import ChatInterface from '@/components/ChatInterface';
import Login from '@/components/Login';
import { marked } from 'marked';
import hljs from 'highlight.js';
// FIX: Removed LogOut as it's no longer used after authentication removal.
import { MessageSquare, Image as ImageIcon, Book as BookIcon, Upload, Download, Bot, Sparkles } from 'lucide-react';

// --- MARKED CONFIG ---
const renderer = new marked.Renderer();
renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  const language = (lang && hljs.getLanguage(lang)) ? lang : 'plaintext';
  const highlighted = hljs.highlight(text, { language, ignoreIllegals: true }).value;
  return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
};
marked.setOptions({ renderer });


// --- HELPER & UI COMPONENTS (DEFINED IN-FILE TO ADHERE TO CONSTRAINTS) ---

type Mode = 'chat' | 'image' | 'book';

const Header: React.FC<{
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
  userEmail: string;
  onLogout: () => void;
}> = ({ currentMode, onModeChange, userEmail, onLogout }) => {
  const modes: { id: Mode, name: string, icon: React.ReactNode }[] = [
    { id: 'chat', name: 'Chat', icon: <MessageSquare size={16} /> },
    { id: 'image', name: 'Image Studio', icon: <ImageIcon size={16} /> },
    { id: 'book', name: 'Book Publisher', icon: <BookIcon size={16} /> },
  ];

  return (
    <header className="p-3 flex justify-between items-center border-b border-[rgba(255,255,255,0.05)] bg-[#1E1E1E] flex-shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
           <Bot size={24} className="text-[#79B8FF]" />
           <h1 className="text-xl font-bold text-[#E2E2E2]">Gemini Content Studio</h1>
        </div>
        <div className="flex items-center bg-[#2C2C2C] p-1 rounded-lg border border-[rgba(255,255,255,0.1)]">
          {modes.map(mode => (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm transition-colors ${currentMode === mode.id ? 'bg-white/10 text-white shadow-sm' : 'text-[#A8ABB4] hover:text-white'}`}
            >
              {mode.icon}
              {mode.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-sm text-[#A8ABB4]">
          {userEmail}
        </div>
        <button
          onClick={onLogout}
          className="px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

// FIX: Removed apiKey prop. The service layer now handles the API key from environment variables.
const ImageEditor: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [sourceImage, setSourceImage] = useState<{ file: File, dataUrl: string } | null>(null);
    const [result, setResult] = useState<{ image: string, text: string, mimeType: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setSourceImage({ file, dataUrl: reader.result as string });
            reader.readAsDataURL(file);
        }
    };
    
    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("Please provide a prompt.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
             if (sourceImage) {
                // Edit image
                const base64Data = sourceImage.dataUrl.split(',')[1];
                const response = await editImage(prompt, base64Data, sourceImage.file.type);
                setResult({ image: response.base64Image, text: response.text, mimeType: response.mimeType });
            } else {
                // Generate image
                const response = await generateImage(prompt);
                setResult({ image: response.base64Image, text: `Generated image for: "${prompt}"`, mimeType: 'image/jpeg' });
            }
        } catch (e: any) {
            setError(e.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex-1 flex flex-col p-4 md:p-6 gap-6 h-full overflow-y-auto">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white">Image Studio</h2>
                <p className="text-md text-[#A8ABB4]">Generate a new image from a text prompt, or upload an image to edit it.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                {/* Input Panel */}
                <div className="bg-[#1E1E1E] rounded-xl border border-[rgba(255,255,255,0.05)] p-5 flex flex-col gap-4">
                    <h3 className="text-lg font-semibold text-[#E2E2E2]">1. Describe Your Image</h3>
                     <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'A photorealistic cat astronaut on Mars'"
                        className="h-24 py-1.5 px-2.5 border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] text-[#E2E2E2] placeholder-[#777777] rounded-lg focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-shadow resize-y text-sm"
                        disabled={isLoading}
                      />
                    
                    <h3 className="text-lg font-semibold text-[#E2E2E2] mt-2">2. Upload Image (for editing)</h3>
                    <div className="flex-1 border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-lg flex items-center justify-center p-4 bg-[#2C2C2C]/50">
                        {sourceImage ? (
                            <img src={sourceImage.dataUrl} alt="Source preview" className="max-h-full max-w-full object-contain rounded-md"/>
                        ) : (
                            <div className="text-center text-[#A8ABB4]">
                                <Upload size={40} className="mx-auto mb-2"/>
                                <p>Optional: Upload an image to edit</p>
                                <p className="text-xs">PNG, JPG, WEBP supported</p>
                            </div>
                        )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="image-upload"/>
                    <button onClick={() => document.getElementById('image-upload')?.click()} className="w-full h-10 flex items-center justify-center gap-2 text-sm bg-white/[.08] hover:bg-white/[.12] text-white rounded-lg transition-colors">
                        {sourceImage ? 'Change Image' : 'Select Image to Edit'}
                    </button>
                    
                      <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="w-full h-10 flex items-center justify-center gap-2 text-sm bg-white/[.12] hover:bg-white/20 text-white rounded-lg transition-colors disabled:bg-[#4A4A4A] disabled:text-[#777777] mt-auto">
                        {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Sparkles size={16}/> {sourceImage ? 'Edit Image' : 'Generate Image'}</>}
                      </button>
                </div>
                {/* Output Panel */}
                <div className="bg-[#1E1E1E] rounded-xl border border-[rgba(255,255,255,0.05)] p-5 flex flex-col gap-4">
                    <h3 className="text-lg font-semibold text-[#E2E2E2]">Result</h3>
                    <div className="flex-1 border-2 border-[rgba(255,255,255,0.1)] rounded-lg flex items-center justify-center p-4 bg-[#2C2C2C]/50">
                        {isLoading && <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>}
                        {error && <p className="text-center text-red-400">{error}</p>}
                        {result && <img src={`data:${result.mimeType};base64,${result.image}`} alt="Generated result" className="max-h-full max-w-full object-contain rounded-md"/>}
                        {!isLoading && !error && !result && <p className="text-center text-[#A8ABB4]">Generated image will appear here</p>}
                    </div>
                     {result?.text && <p className="text-sm text-center text-[#A8ABB4] p-2 bg-[#2C2C2C] rounded-md">{result.text}</p>}
                </div>
            </div>
        </div>
    );
};

// FIX: Removed apiKey prop. The service layer now handles the API key from environment variables.
const BookGenerator: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [book, setBook] = useState<Book | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleGenerate = async () => {
        // FIX: Removed apiKey check as it's handled by the service.
        if (!topic.trim()) {
            setError("Please enter a topic for your book.");
            return;
        }
        setIsGenerating(true);
        setError(null);
        setBook(null);
        try {
            // FIX: Removed apiKey argument from service call.
            const generatedBook = await generateBook(topic);
            setBook(generatedBook);
            setActiveIndex(0);
        } catch(e: any) {
            setError(e.message || "Failed to generate the book.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleDownload = () => {
        if (!book) return;
        const styles = `
            body { font-family: sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1, h2 { color: #111; }
            pre { background: #f4f4f4; padding: 1em; border-radius: 5px; overflow-x: auto; }
            code { font-family: monospace; }
        `;
        const content = book.chapters.map(ch => `<h2>${ch.title}</h2>\n${marked.parse(ch.content)}`).join('\n<hr>\n');
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${book.title}</title>
                <style>${styles}</style>
            </head>
            <body>
                <h1>${book.title}</h1>
                ${content}
            </body>
            </html>
        `;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${book.title.replace(/\s+/g, '_')}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 h-full overflow-hidden">
            <div className="text-center flex-shrink-0">
                <h2 className="text-2xl font-bold text-white">Book Publisher</h2>
                <p className="text-md text-[#A8ABB4]">Generate a complete book on any topic with a table of contents.</p>
            </div>
            <div className="flex gap-2 mb-2 flex-shrink-0">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter a book topic, e.g., 'The History of Space Exploration'"
                    className="flex-grow h-10 py-1.5 px-3 border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] text-[#E2E2E2] placeholder-[#777777] rounded-lg focus:ring-1 focus:ring-white/20 transition-shadow text-sm"
                    disabled={isGenerating}
                    onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button onClick={handleGenerate} disabled={isGenerating || !topic.trim()} className="h-10 px-4 flex items-center justify-center gap-2 text-sm bg-white/[.12] hover:bg-white/20 text-white rounded-lg transition-colors disabled:bg-[#4A4A4A] disabled:text-[#777777] flex-shrink-0">
                    {isGenerating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><BookIcon size={16}/> Generate Book</>}
                </button>
            </div>
            
            {error && <div className="text-center text-red-400 p-4 bg-red-500/10 rounded-lg">{error}</div>}
            
            <div className="flex-1 flex gap-6 overflow-hidden">
                {!book && !isGenerating && (
                    <div className="flex-1 flex items-center justify-center text-center text-[#A8ABB4] bg-[#1E1E1E] rounded-xl border border-[rgba(255,255,255,0.05)]">Enter a topic and click "Generate Book" to start.</div>
                )}
                 {isGenerating && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-[#A8ABB4] bg-[#1E1E1E] rounded-xl border border-[rgba(255,255,255,0.05)]">
                        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-lg font-semibold">Generating your book...</p>
                        <p className="text-sm">This may take a few moments.</p>
                    </div>
                )}
                {book && (
                    <>
                        {/* Table of Contents */}
                        <aside className="w-1/4 bg-[#1E1E1E] rounded-xl border border-[rgba(255,255,255,0.05)] p-4 flex flex-col">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-lg text-white truncate" title={book.title}>{book.title}</h3>
                                <button onClick={handleDownload} className="p-2 text-[#A8ABB4] hover:text-white hover:bg-white/10 rounded-md" aria-label="Download Book"><Download size={16}/></button>
                            </div>
                            <nav className="flex-1 overflow-y-auto pr-2">
                                <ul className="space-y-1">
                                    {book.chapters.map((ch, idx) => (
                                        <li key={idx}>
                                            <button onClick={() => setActiveIndex(idx)} className={`w-full text-left text-sm p-2 rounded-md transition-colors ${activeIndex === idx ? 'bg-white/10 text-white' : 'text-[#A8ABB4] hover:bg-white/5'}`}>
                                                {idx + 1}. {ch.title}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </aside>
                        {/* Content */}
                        <main className="w-3/4 bg-[#1E1E1E] rounded-xl border border-[rgba(255,255,255,0.05)] p-6 overflow-y-auto">
                           <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(book.chapters[activeIndex]?.content || '') }}/>
                        </main>
                    </>
                )}
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [urlGroups, setUrlGroups] = useState<URLGroup[]>([]);
  const [activeUrlGroupId, setActiveUrlGroupId] = useState<string>('');
  const [fileContext, setFileContext] = useState<FileContext | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [initialQuerySuggestions, setInitialQuerySuggestions] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>('chat');
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(true);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isAppLoading, setIsAppLoading] = useState(true);

  const MAX_URLS = 20;
  const activeGroup = urlGroups.find(group => group.id === activeUrlGroupId);
  const currentUrlsForChat = activeGroup ? activeGroup.urls : [];

  // Check if user is logged in on app start
  useEffect(() => {
    const checkLoginStatus = () => {
      const hasLoggedIn = localStorage.getItem('has_logged_in');
      const savedApiKey = localStorage.getItem('gemini_api_key');
      const savedEmail = localStorage.getItem('user_email');
      
      if (hasLoggedIn === 'true' && savedApiKey && savedEmail) {
        setIsLoggedIn(true);
        setUserEmail(savedEmail);
        // Set the API key in the environment for the service
        (window as any).VITE_API_KEY = savedApiKey;
      }
      
      setIsAppLoading(false);
    };

    checkLoginStatus();
  }, []);

  // Load URL groups after login check
  useEffect(() => {
    if (!isAppLoading) {
      const userGroups = getInitialUrlGroups();
      setUrlGroups(userGroups);
      
      const savedActiveId = localStorage.getItem('activeUrlGroupId');
      if (savedActiveId && userGroups.some(g => g.id === savedActiveId)) {
        setActiveUrlGroupId(savedActiveId);
      } else {
        setActiveUrlGroupId(userGroups[0]?.id || '');
      }
    }
  }, [isAppLoading]);

  useEffect(() => {
    localStorage.setItem('urlGroups', JSON.stringify(urlGroups));
    if (urlGroups.length > 0 && !urlGroups.some(g => g.id === activeUrlGroupId)) {
        setActiveUrlGroupId(urlGroups[0].id);
    } else if (urlGroups.length === 0) {
      const newDefaultGroup = { id: `group-${Date.now()}`, name: 'My Knowledge Base', urls: [] };
      setUrlGroups([newDefaultGroup]);
      setActiveUrlGroupId(newDefaultGroup.id);
    }
  }, [urlGroups, activeUrlGroupId]);

  useEffect(() => {
      if (activeUrlGroupId) {
          localStorage.setItem('activeUrlGroupId', activeUrlGroupId);
      }
  }, [activeUrlGroupId]);

  useEffect(() => {
    if (mode !== 'chat') return;
    const currentActiveGroup = urlGroups.find(group => group.id === activeUrlGroupId);
    let welcomeMessageText = `Welcome to Chat Mode! You're viewing the "${currentActiveGroup?.name || 'Untitled'}" knowledge base.`;
    
    if ((currentActiveGroup && currentActiveGroup.urls.length > 0) || fileContext) {
      welcomeMessageText += " Ask me anything, or try a suggestion.";
    } else {
      welcomeMessageText += " Add documentation URLs or a file to start asking questions.";
    }

    setChatMessages([{
      id: `system-welcome-${activeUrlGroupId}-${Date.now()}`,
      text: welcomeMessageText,
      sender: MessageSender.SYSTEM,
      timestamp: new Date(),
    }]);
  }, [activeUrlGroupId, urlGroups, fileContext, mode]); 


  const fetchAndSetInitialSuggestions = useCallback(async (currentUrls: string[], fileCtx: FileContext | null) => {
    if (currentUrls.length === 0 && !fileCtx) return;
      
    setIsFetchingSuggestions(true);
    setInitialQuerySuggestions([]); 

    try {
      // FIX: Removed apiKey from service call.
      const response = await getInitialSuggestions(currentUrls, fileCtx?.content || null); 
      let suggestionsArray: string[] = [];
      if (response.text) {
        try {
          const parsed = JSON.parse(response.text.trim().replace(/^```json\s*|```\s*$/g, ''));
          if (parsed && Array.isArray(parsed.suggestions)) {
            suggestionsArray = parsed.suggestions.filter((s: unknown) => typeof s === 'string');
          }
        } catch (parseError) {
          console.error("Failed to parse suggestions JSON:", parseError, "Raw text:", response.text);
        }
      }
      setInitialQuerySuggestions(suggestionsArray.slice(0, 4)); 
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to fetch initial suggestions.';
      setChatMessages(prev => [...prev, { id: `sys-err-suggestion-fetch-${Date.now()}`, text: `Error: ${errorMessage}`, sender: MessageSender.SYSTEM, timestamp: new Date() }]);
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, []); 

  useEffect(() => {
    // FIX: Removed apiKey check.
    if (mode === 'chat' && (currentUrlsForChat.length > 0 || fileContext)) { 
        fetchAndSetInitialSuggestions(currentUrlsForChat, fileContext);
    } else {
        setInitialQuerySuggestions([]); 
    }
  }, [mode, currentUrlsForChat, fileContext, fetchAndSetInitialSuggestions]); 


  const handleAddUrl = (url: string) => {
    setUrlGroups(prevGroups => 
      prevGroups.map(group => group.id === activeUrlGroupId ? { ...group, urls: [...group.urls, url].slice(0, MAX_URLS) } : group)
    );
  };
  
  const handleAddFile = (file: File) => {
    if (file.type !== 'text/plain') return;
    const reader = new FileReader();
    reader.onload = (e) => setFileContext({ name: file.name, content: e.target?.result as string });
    reader.readAsText(file);
  };

  const handleRemoveFile = () => setFileContext(null);
  
  const handleSetTextContext = (content: string) => {
    if (content.trim()) setFileContext({ name: 'Pasted Content', content: content.trim() });
    else setFileContext(null);
  };

  const handleRemoveUrl = (urlToRemove: string) => {
    setUrlGroups(prevGroups => prevGroups.map(group => group.id === activeUrlGroupId ? { ...group, urls: group.urls.filter(url => url !== urlToRemove) } : group));
  };
  
  const handleAddGroup = (name: string) => {
    const newGroup: URLGroup = { id: `group-${Date.now()}`, name, urls: [] };
    setUrlGroups(prev => [...prev, newGroup]);
    setActiveUrlGroupId(newGroup.id);
  };

  const handleRemoveGroup = (groupId: string) => {
    if (urlGroups.length <= 1) return;
    const groupToRemove = urlGroups.find(g => g.id === groupId);
    if (window.confirm(`Delete "${groupToRemove?.name}"?`)) {
      const remaining = urlGroups.filter(g => g.id !== groupId);
      if (activeUrlGroupId === groupId) setActiveUrlGroupId(remaining[0]?.id || '');
      setUrlGroups(remaining);
    }
  };

  const handleRenameGroup = (groupId: string, newName: string) => {
    if (!newName.trim()) return;
    setUrlGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName.trim() } : g));
  };

  const handleLogin = (apiKey: string, email: string) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    // Set the API key in the global scope for the service
    (window as any).VITE_API_KEY = apiKey;
  };

  const handleLogout = () => {
    localStorage.removeItem('has_logged_in');
    localStorage.removeItem('gemini_api_key');
    localStorage.removeItem('user_email');
    setIsLoggedIn(false);
    setUserEmail('');
    (window as any).VITE_API_KEY = undefined;
  };

  const handleSendMessage = async (query: string) => {
    // FIX: Removed apiKey check.
    if (!query.trim() || isLoading || isFetchingSuggestions) return;

    setIsLoading(true);
    setInitialQuerySuggestions([]); 

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, text: query, sender: MessageSender.USER, timestamp: new Date() };
    const modelPlaceholder: ChatMessage = { id: `model-${Date.now()}`, text: 'Thinking...', sender: MessageSender.MODEL, timestamp: new Date(), isLoading: true };

    setChatMessages(prev => [...prev, userMessage, modelPlaceholder]);

    try {
      // FIX: Removed apiKey from service call.
      const response = await generateContentWithUrlContext(query, currentUrlsForChat, fileContext, useWebSearch, useThinking, customPrompt);
      setChatMessages(prev => prev.map(msg => msg.id === modelPlaceholder.id ? { ...modelPlaceholder, text: response.text || "I received an empty response.", isLoading: false, urlContext: response.urlContextMetadata } : msg));
    } catch (e: any) {
      setChatMessages(prev => prev.map(msg => msg.id === modelPlaceholder.id ? { ...modelPlaceholder, text: `Error: ${e.message}`, sender: MessageSender.SYSTEM, isLoading: false } : msg));
    } finally {
      setIsLoading(false);
    }
  };

  const getInitialUrlGroups = (): URLGroup[] => {
    try {
      // FIX: Use generic localStorage key.
      const saved = localStorage.getItem('urlGroups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { console.error(e); }
    return [{ id: `group-${Date.now()}`, name: 'My First Knowledge Base', urls: [] }];
  };
  
  // Show loading screen while checking login status
  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-[#282828] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#79B8FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#A8ABB4]">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#282828] text-white font-sans">
      <Header currentMode={mode} onModeChange={setMode} userEmail={userEmail} onLogout={handleLogout} />
      
      {mode === 'chat' && (
        <div className="flex flex-1 h-full overflow-hidden">
            <aside className={`absolute md:relative z-20 md:z-auto w-80 md:w-80 lg:w-96 h-full bg-[#1E1E1E] transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
              <KnowledgeBaseManager 
                urls={currentUrlsForChat} onAddUrl={handleAddUrl} onRemoveUrl={handleRemoveUrl} maxUrls={MAX_URLS}
                urlGroups={urlGroups} activeUrlGroupId={activeUrlGroupId} onSetGroupId={setActiveUrlGroupId}
                onAddGroup={handleAddGroup} onRemoveGroup={handleRemoveGroup} onRenameGroup={handleRenameGroup}
                onCloseSidebar={() => setIsSidebarOpen(false)}
                fileContext={fileContext} onAddFile={handleAddFile} onRemoveFile={handleRemoveFile} onSetTextContext={handleSetTextContext}
              />
            </aside>
            <main className="flex-1 flex flex-col p-2 md:p-3 h-full overflow-hidden">
              <ChatInterface
                messages={chatMessages} onSendMessage={handleSendMessage} isLoading={isLoading}
                placeholderText={(currentUrlsForChat.length > 0 || fileContext) ? `Ask about "${activeGroup?.name || 'Untitled'}"...` : `Add URLs or a file to start...`}
                initialQuerySuggestions={initialQuerySuggestions} onSuggestedQueryClick={handleSendMessage} isFetchingSuggestions={isFetchingSuggestions}
                onToggleSidebar={() => setIsSidebarOpen(true)}
                useWebSearch={useWebSearch} onWebSearchChange={setUseWebSearch}
                useThinking={useThinking} onThinkingChange={setUseThinking}
                customPrompt={customPrompt} onCustomPromptChange={setCustomPrompt}
              />
            </main>
        </div>
      )}
      {mode === 'image' && <ImageEditor />}
      {mode === 'book' && <BookGenerator />}
    </div>
  );
};

export default App;