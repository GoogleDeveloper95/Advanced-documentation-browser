/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageSender } from '@/types'; 
import MessageItem from '@/components/MessageItem';
import { Send, Menu, Settings, Search, BrainCircuit } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (query: string) => void;
  isLoading: boolean;
  placeholderText?: string;
  initialQuerySuggestions?: string[];
  onSuggestedQueryClick?: (query: string) => void;
  isFetchingSuggestions?: boolean;
  onToggleSidebar?: () => void;
  useWebSearch: boolean;
  onWebSearchChange: (value: boolean) => void;
  useThinking: boolean;
  onThinkingChange: (value: boolean) => void;
  customPrompt: string;
  onCustomPromptChange: (value: string) => void;
}

const Switch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  icon: React.ReactNode;
}> = ({ checked, onChange, label, icon }) => (
    <label className="flex items-center justify-between cursor-pointer w-full p-2 hover:bg-white/5 rounded-md">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-white">{label}</span>
      </div>
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`block w-10 h-5 rounded-full transition ${checked ? 'bg-[#79B8FF]' : 'bg-[#4A4A4A]'}`}></div>
        <div className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`}></div>
      </div>
    </label>
);

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  placeholderText,
  initialQuerySuggestions,
  onSuggestedQueryClick,
  isFetchingSuggestions,
  onToggleSidebar,
  useWebSearch,
  onWebSearchChange,
  useThinking,
  onThinkingChange,
  customPrompt,
  onCustomPromptChange,
}) => {
  const [userQuery, setUserQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (userQuery.trim() && !isLoading) {
      onSendMessage(userQuery.trim());
      setUserQuery('');
    }
  };

  const showSuggestions = initialQuerySuggestions && initialQuerySuggestions.length > 0 && messages.filter(m => m.sender !== MessageSender.SYSTEM).length <= 1;

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] rounded-xl shadow-md border border-[rgba(255,255,255,0.05)]">
      <div className="p-4 border-b border-[rgba(255,255,255,0.05)] flex justify-between items-center">
        <div className="flex items-center gap-3">
           {onToggleSidebar && (
            <button onClick={onToggleSidebar} className="p-1.5 text-[#A8ABB4] hover:text-white rounded-md hover:bg-white/10 transition-colors md:hidden" aria-label="Open knowledge base">
              <Menu size={20} />
            </button>
          )}
          <div>
            <h2 className="text-xl font-semibold text-[#E2E2E2]">Knowledge Base Chat</h2>
            {placeholderText && messages.filter(m => m.sender !== MessageSender.SYSTEM).length === 0 && (
               <p className="text-xs text-[#A8ABB4] mt-1 max-w-md truncate" title={placeholderText}>{placeholderText}</p>
            )}
          </div>
        </div>
        
        <div className="relative" ref={settingsRef}>
            <button onClick={() => setIsSettingsOpen(prev => !prev)} className="p-1.5 text-[#A8ABB4] hover:text-white rounded-md hover:bg-white/10 transition-colors" aria-label="Chat Settings">
              <Settings size={18} />
            </button>
            {isSettingsOpen && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-[#2C2C2C] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl z-10 p-3 space-y-3">
                 <Switch checked={useWebSearch} onChange={onWebSearchChange} label="Web Search" icon={<Search size={16}/>} />
                 <Switch checked={useThinking} onChange={onThinkingChange} label="Model Thinking" icon={<BrainCircuit size={16}/>}/>
                 
                 <div className="border-t border-[rgba(255,255,255,0.1)] pt-3">
                   <label className="block text-sm font-medium text-[#E2E2E2] mb-2">
                     Custom System Prompt
                   </label>
                   <textarea
                     value={customPrompt}
                     onChange={(e) => onCustomPromptChange(e.target.value)}
                     placeholder="Add instructions for how the AI should respond (e.g., 'Always be concise and technical', 'Explain like I'm 5', etc.)"
                     className="w-full h-20 px-3 py-2 text-sm bg-[#1E1E1E] border border-[rgba(255,255,255,0.1)] rounded-md text-[#E2E2E2] placeholder-[#777777] focus:ring-1 focus:ring-[#79B8FF] focus:border-[#79B8FF] resize-none"
                   />
                   <p className="text-xs text-[#A8ABB4] mt-1">
                     This will be added to every AI response to customize its behavior.
                   </p>
                 </div>
              </div>
            )}
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto chat-container bg-[#282828]">
        <div className="max-w-4xl mx-auto w-full">
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
          
          {isFetchingSuggestions && (
              <div className="flex justify-center items-center p-3">
                  <div className="flex items-center space-x-1.5 text-[#A8ABB4]">
                      <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></div>
                      <span className="text-sm">Fetching suggestions...</span>
                  </div>
              </div>
          )}

          {showSuggestions && onSuggestedQueryClick && (
            <div className="my-3 px-1">
              <p className="text-xs text-[#A8ABB4] mb-1.5 font-medium">Or try one of these: </p>
              <div className="flex flex-wrap gap-1.5">
                {initialQuerySuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestedQueryClick(suggestion)}
                    className="bg-[#79B8FF]/10 text-[#79B8FF] px-2.5 py-1 rounded-full text-xs hover:bg-[#79B8FF]/20 transition-colors shadow-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-[rgba(255,255,255,0.05)] bg-[#1E1E1E] rounded-b-xl">
        <div className="flex items-center gap-2">
          <textarea
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Ask about the documents..."
            className="flex-grow h-8 min-h-[32px] py-1.5 px-2.5 border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] text-[#E2E2E2] placeholder-[#777777] rounded-lg focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-shadow resize-none text-sm"
            rows={1}
            disabled={isLoading || isFetchingSuggestions}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || isFetchingSuggestions || !userQuery.trim()}
            className="h-8 w-8 p-1.5 bg-white/[.12] hover:bg-white/20 text-white rounded-lg transition-colors disabled:bg-[#4A4A4A] disabled:text-[#777777] flex items-center justify-center flex-shrink-0"
            aria-label="Send message"
          >
            {(isLoading && messages[messages.length-1]?.isLoading && messages[messages.length-1]?.sender === MessageSender.MODEL) ? 
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> 
              : <Send size={16} />
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;