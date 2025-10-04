/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ChevronDown, X, Pencil, Check, Upload, Save } from 'lucide-react';
import { URLGroup, FileContext } from '@/types';

interface KnowledgeBaseManagerProps {
  urls: string[];
  onAddUrl: (url: string) => void;
  onRemoveUrl: (url: string) => void;
  maxUrls?: number;
  urlGroups: URLGroup[];
  activeUrlGroupId: string;
  onSetGroupId: (id: string) => void;
  onCloseSidebar?: () => void;
  onAddGroup: (name: string) => void;
  onRemoveGroup: (id: string) => void;
  onRenameGroup: (id: string, newName: string) => void;
  fileContext: FileContext | null;
  onAddFile: (file: File) => void;
  onRemoveFile: () => void;
  onSetTextContext: (content: string) => void;
}

const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({ 
  urls, 
  onAddUrl, 
  onRemoveUrl, 
  maxUrls = 20,
  urlGroups,
  activeUrlGroupId,
  onSetGroupId,
  onCloseSidebar,
  onAddGroup,
  onRemoveGroup,
  onRenameGroup,
  fileContext,
  onAddFile,
  onRemoveFile,
  onSetTextContext,
}) => {
  const [currentUrlInput, setCurrentUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [isRenaming, setIsRenaming] = useState(false);
  const activeGroup = urlGroups.find(g => g.id === activeUrlGroupId);
  const [renameInput, setRenameInput] = useState(activeGroup?.name || '');
  const [newGroupName, setNewGroupName] = useState('');
  
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeGroup && !isRenaming) {
      setRenameInput(activeGroup.name);
    }
  }, [activeGroup, isRenaming]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        onAddFile(file);
    }
    // Reset file input value to allow re-uploading the same file
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleSavePastedText = () => {
    onSetTextContext(pastedText);
    setPastedText(''); // Clear input after saving
  };

  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleAddUrl = () => {
    if (!currentUrlInput.trim()) {
      setError('URL cannot be empty.');
      return;
    }
    if (!isValidUrl(currentUrlInput)) {
      setError('Invalid URL format. Please include http:// or https://');
      return;
    }
    if (urls.length >= maxUrls) {
      setError(`You can add a maximum of ${maxUrls} URLs to the current group.`);
      return;
    }
    if (urls.includes(currentUrlInput)) {
      setError('This URL has already been added to the current group.');
      return;
    }
    onAddUrl(currentUrlInput);
    setCurrentUrlInput('');
    setError(null);
  };
  
  const handleConfirmRename = () => {
    if (renameInput.trim() && activeGroup) {
      onRenameGroup(activeGroup.id, renameInput.trim());
      setIsRenaming(false);
    }
  };
  
  const handleAddNewGroup = () => {
    if (newGroupName.trim()) {
      onAddGroup(newGroupName.trim());
      setNewGroupName('');
    }
  };

  return (
    <div className="p-4 bg-[#1E1E1E] shadow-md rounded-xl h-full flex flex-col border border-[rgba(255,255,255,0.05)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[#E2E2E2]">Knowledge Base</h2>
        {onCloseSidebar && (
          <button
            onClick={onCloseSidebar}
            className="p-1 text-[#A8ABB4] hover:text-white rounded-md hover:bg-white/10 transition-colors md:hidden"
            aria-label="Close knowledge base"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {/* --- Group Management --- */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#E2E2E2] mb-2">Manage Groups</h3>
        
        {/* Create New Group */}
        <div className="mb-3">
          <label htmlFor="new-group-input" className="block text-sm font-medium text-[#A8ABB4] mb-1">
            Create New Group
          </label>
          <div className="flex items-center gap-2">
            <input
              id="new-group-input"
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="New group name..."
              className="flex-grow h-8 py-1 px-2.5 border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] text-[#E2E2E2] placeholder-[#777777] rounded-lg focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-shadow text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleAddNewGroup()}
            />
            <button
              onClick={handleAddNewGroup}
              className="h-8 w-8 p-1.5 bg-white/[.12] hover:bg-white/20 text-white rounded-lg transition-colors disabled:bg-[#4A4A4A] disabled:text-[#777777] flex items-center justify-center flex-shrink-0"
              aria-label="Add new group"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        
        {/* Active Group Selection & Actions */}
        <div>
          <label htmlFor="url-group-select-kb" className="block text-sm font-medium text-[#A8ABB4] mb-1">
            Active Group
          </label>
          {isRenaming ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleConfirmRename()}
                className="flex-grow h-9 py-1 px-2.5 border border-white/20 bg-[#2C2C2C] text-[#E2E2E2] rounded-md focus:ring-1 focus:ring-white/20 text-sm"
                autoFocus
              />
              <button onClick={handleConfirmRename} className="h-9 w-9 p-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-md transition-colors"><Check size={20} /></button>
              <button onClick={() => setIsRenaming(false)} className="h-9 w-9 p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-md transition-colors"><X size={20} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex-grow">
                <select
                  id="url-group-select-kb"
                  value={activeUrlGroupId}
                  onChange={(e) => onSetGroupId(e.target.value)}
                  className="w-full h-9 py-2 pl-3 pr-8 appearance-none border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] text-[#E2E2E2] rounded-md focus:ring-1 focus:ring-white/20 focus:border-white/20 text-sm"
                >
                  {urlGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8ABB4] pointer-events-none" />
              </div>
              <button onClick={() => setIsRenaming(true)} className="h-9 w-9 p-2 text-[#A8ABB4] hover:text-white hover:bg-white/10 rounded-md transition-colors" aria-label="Rename active group"><Pencil size={16} /></button>
              <button onClick={() => onRemoveGroup(activeUrlGroupId)} disabled={urlGroups.length <= 1} className="h-9 w-9 p-2 text-[#A8ABB4] hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Delete active group"><Trash2 size={16} /></button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto chat-container pr-1">
        {/* --- URL Management --- */}
        <div id="url-management-section">
          <h3 className="text-base font-semibold text-[#E2E2E2] mb-2">Manage URLs in "{activeGroup?.name || '...'}"</h3>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="url"
              value={currentUrlInput}
              onChange={(e) => setCurrentUrlInput(e.target.value)}
              placeholder="https://docs.example.com"
              className="flex-grow h-8 py-1 px-2.5 border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] text-[#E2E2E2] placeholder-[#777777] rounded-lg focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-shadow text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
            />
            <button
              onClick={handleAddUrl}
              disabled={urls.length >= maxUrls}
              className="h-8 w-8 p-1.5 bg-white/[.12] hover:bg-white/20 text-white rounded-lg transition-colors disabled:bg-[#4A4A4A] disabled:text-[#777777] flex items-center justify-center flex-shrink-0"
              aria-label="Add URL"
            >
              <Plus size={16} />
            </button>
          </div>
          {error && <p className="text-xs text-[#f87171] mb-2">{error}</p>}
          {urls.length >= maxUrls && <p className="text-xs text-[#fbbf24] mb-2">Maximum {maxUrls} URLs reached for this group.</p>}
          
          <div className="space-y-2">
            {urls.length === 0 && (
              <p className="text-[#777777] text-center py-3 text-sm">Add documentation URLs to start querying.</p>
            )}
            {urls.map((url) => (
              <div key={url} className="flex items-center justify-between p-2.5 bg-[#2C2C2C] border border-[rgba(255,255,255,0.05)] rounded-lg hover:shadow-sm transition-shadow">
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#79B8FF] hover:underline truncate" title={url}>
                  {url}
                </a>
                <button 
                  onClick={() => onRemoveUrl(url)}
                  className="p-1 text-[#A8ABB4] hover:text-[#f87171] rounded-md hover:bg-[rgba(255,0,0,0.1)] transition-colors flex-shrink-0 ml-2"
                  aria-label={`Remove ${url}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[rgba(255,255,255,0.05)] my-4"></div>

        {/* --- File & Text Context --- */}
        <div id="local-context-section">
          <h3 className="text-base font-semibold text-[#E2E2E2] mb-3">Local Context</h3>

          <div className="space-y-3">
            {/* File Upload */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt"
                className="hidden"
                id="file-upload-input"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-9 flex items-center justify-center gap-2 text-sm bg-white/[.08] hover:bg-white/[.12] text-white rounded-lg transition-colors"
              >
                <Upload size={14} />
                Upload .txt File
              </button>
            </div>

            {fileContext && (
              <div className="flex items-center justify-between p-2.5 bg-[#2C2C2C] border border-[rgba(255,255,255,0.05)] rounded-lg">
                <span className="text-xs text-[#E2E2E2] truncate" title={fileContext.name}>
                  Active: {fileContext.name}
                </span>
                <button
                  onClick={onRemoveFile}
                  className="p-1 text-[#A8ABB4] hover:text-[#f87171] rounded-md hover:bg-[rgba(255,0,0,0.1)] transition-colors flex-shrink-0 ml-2"
                  aria-label={`Remove ${fileContext.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            {/* Pasted Text Input */}
            <div>
              <label htmlFor="pasted-text-input" className="block text-sm font-medium text-[#A8ABB4] mb-1">
                Or Paste Text Below
              </label>
              <textarea
                id="pasted-text-input"
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste any relevant text content here..."
                className="w-full py-1.5 px-2.5 border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] text-[#E2E2E2] placeholder-[#777777] rounded-lg focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-shadow resize-y text-sm"
              />
              <button
                onClick={handleSavePastedText}
                disabled={!pastedText.trim()}
                className="w-full mt-2 h-9 flex items-center justify-center gap-2 text-sm bg-white/[.12] hover:bg-white/20 text-white rounded-lg transition-colors disabled:bg-[#4A4A4A] disabled:text-[#777777] disabled:cursor-not-allowed"
              >
                <Save size={14} />
                Save Text as Context
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default KnowledgeBaseManager;
