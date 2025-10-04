/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export enum MessageSender {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
}

export interface UrlContextMetadataItem {
  retrievedUrl: string; // Changed from retrieved_url
  urlRetrievalStatus: string; // Changed from url_retrieval_status
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: Date;
  isLoading?: boolean;
  urlContext?: UrlContextMetadataItem[];
}

export interface URLGroup {
  id: string;
  name: string;
  urls: string[];
}

// FIX: Removed User type as it is no longer needed after refactoring API key handling.
export interface FileContext {
  name: string;
  content: string;
}

export interface Chapter {
  title: string;
  content: string;
}

export interface Book {
  title: string;
  chapters: Chapter[];
}
