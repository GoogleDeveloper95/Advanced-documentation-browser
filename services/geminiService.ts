/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, GenerateContentResponse, Tool, HarmCategory, HarmBlockThreshold, Content, Type, Modality } from "@google/genai";
import { UrlContextMetadataItem, FileContext, Book } from '@/types';

const MODEL_NAME = "gemini-2.5-flash"; 
const IMAGE_MODEL_NAME = "gemini-2.5-flash-image";

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

interface GeminiResponse {
  text: string;
  urlContextMetadata?: UrlContextMetadataItem[];
}

export const generateContentWithUrlContext = async (
  // FIX: Removed apiKey parameter. API key is now handled by environment variables.
  prompt: string,
  urls: string[],
  fileContext: FileContext | null,
  useWebSearch: boolean,
  useThinking: boolean,
  customPrompt: string = '',
): Promise<GeminiResponse> => {
  // FIX: Initialize with API key from environment variables as per guidelines.
  const apiKey = (window as any).VITE_API_KEY || import.meta.env.VITE_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  let fullPrompt = prompt;

  // Add custom system prompt if provided
  if (customPrompt.trim()) {
    fullPrompt = `${customPrompt}\n\nUser Question: ${prompt}`;
  }

  if (fileContext) {
    fullPrompt += `\n\nUse the following file context from "${fileContext.name}":\n---\n${fileContext.content}\n---`;
  }
  
  if (urls.length > 0) {
    const urlList = urls.join('\n');
    fullPrompt += `\n\nRelevant URLs for context:\n${urlList}`;
  }

  const tools: Tool[] = useWebSearch ? [{googleSearch: {}}] : [{ urlContext: {} } as any];
  const contents: Content[] = [{ role: "user", parts: [{ text: fullPrompt }] }];
  
  const config: any = { 
    tools: tools,
    safetySettings: safetySettings,
  };

  if (!useThinking) {
    config.thinkingConfig = { thinkingBudget: 0 };
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: config,
    });

    const text = response.text || "";
    const candidate = response.candidates?.[0];
    let extractedUrlContextMetadata: UrlContextMetadataItem[] | undefined = undefined;

    if ((candidate as any)?.urlContextMetadata?.urlMetadata) {
      extractedUrlContextMetadata = (candidate as any).urlContextMetadata.urlMetadata as UrlContextMetadataItem[];
    }
    
    return { text, urlContextMetadata: extractedUrlContextMetadata };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
      const googleError = error as any; 
      if (googleError.message && googleError.message.includes("API key not valid")) {
         throw new Error("Invalid API Key. Please check the key you provided.");
      }
      if (googleError.message && googleError.message.includes("quota")) {
        throw new Error("API quota exceeded. Please check your Gemini API quota.");
      }
      if (googleError.type === 'GoogleGenAIError' && googleError.message) {
        throw new Error(`Gemini API Error: ${googleError.message}`);
      }
      throw new Error(`Failed to get response from AI: ${error.message}`);
    }
    throw new Error("Failed to get response from AI due to an unknown error.");
  }
};

export const getInitialSuggestions = async (
  // FIX: Removed apiKey parameter.
  urls: string[],
  fileContent: string | null
): Promise<GeminiResponse> => {
  if (urls.length === 0 && !fileContent) {
    return { text: JSON.stringify({ suggestions: ["Add some URLs or a file to get topic suggestions."] }) };
  }
  // FIX: Initialize with API key from environment variables as per guidelines.
  const apiKey = (window as any).VITE_API_KEY || import.meta.env.VITE_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  let contextPrompt = '';
  if (fileContent) {
    contextPrompt += `Based on the content of the following text file:\n---\n${fileContent}\n---\n\n`;
  }
  if (urls.length > 0) {
    const urlList = urls.join('\n');
    contextPrompt += `And based on the content of the following documentation URLs:\n${urlList}\n\n`;
  }
  
  const promptText = `${contextPrompt}Provide 3-4 concise and actionable questions a developer might ask to explore this content. These questions should be suitable as quick-start prompts. Return ONLY a JSON object with a key "suggestions" containing an array of these question strings. For example: {"suggestions": ["What are the rate limits?", "How do I get an API key?", "Explain model X."]}`;

  const contents: Content[] = [{ role: "user", parts: [{ text: promptText }] }];

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        safetySettings: safetySettings,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    return { text };

  } catch (error) {
    console.error("Error calling Gemini API for initial suggestions:", error);
     if (error instanceof Error) {
      const googleError = error as any; 
      if (googleError.message && googleError.message.includes("API key not valid")) {
         throw new Error("Invalid API Key. Please check the key you provided.");
      }
      throw new Error(`Failed to get initial suggestions from AI: ${error.message}`);
    }
    throw new Error("Failed to get initial suggestions from AI due to an unknown error.");
  }
};

export const editImage = async (
  prompt: string,
  base64ImageData: string,
  mimeType: string,
): Promise<{ base64Image: string, text: string, mimeType: string }> => {
  const apiKey = (window as any).VITE_API_KEY || import.meta.env.VITE_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  const imagePart = {
    inlineData: {
      data: base64ImageData,
      mimeType: mimeType,
    },
  };
  const textPart = { text: prompt };

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    let resultImage = '';
    let resultText = '';
    let resultMimeType = 'image/png';
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        resultImage = part.inlineData.data || '';
        resultMimeType = part.inlineData.mimeType || resultMimeType;
      } else if (part.text) {
        resultText += part.text;
      }
    }
    
    if (!resultImage) {
      throw new Error("The model did not return an image. It might have refused the request.");
    }
    
    return { base64Image: resultImage, text: resultText || "Image edited successfully.", mimeType: resultMimeType };

  } catch (error) {
    console.error("Error calling Gemini Image Editing API:", error);
    if (error instanceof Error) {
        throw new Error(`Image editing failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred during image editing.");
  }
};

export const generateImage = async (
  prompt: string,
): Promise<{ base64Image: string }> => {
  const apiKey = (window as any).VITE_API_KEY || import.meta.env.VITE_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("The model did not return an image.");
    }

    const base64ImageBytes: string = response.generatedImages[0]?.image?.imageBytes || '';
    return { base64Image: base64ImageBytes };

  } catch (error) {
    console.error("Error calling Gemini Image Generation API:", error);
    if (error instanceof Error) {
        throw new Error(`Image generation failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred during image generation.");
  }
};


// FIX: Removed apiKey parameter.
export const generateBook = async (topic: string): Promise<Book> => {
    // FIX: Initialize with API key from environment variables as per guidelines.
    const apiKey = (window as any).VITE_API_KEY || import.meta.env.VITE_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

    // Step 1: Generate the book outline
    const outlineResponse = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Generate a comprehensive book outline for the topic: "${topic}". Include a book title and a list of 5-7 relevant chapter titles. Return ONLY a JSON object.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    chapters: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                    },
                },
                required: ["title", "chapters"],
            },
        },
    });

    let outline;
    try {
      let jsonStr = (outlineResponse.text || '').trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s; 
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }
      outline = JSON.parse(jsonStr);
    } catch(e) {
      console.error("Failed to parse book outline:", e, "Raw text:", outlineResponse.text);
      throw new Error("Could not generate a valid book outline.");
    }

    const { title, chapters: chapterTitles } = outline;

    // Step 2: Generate content for each chapter
    const chapterPromises = chapterTitles.map((chapterTitle: string) =>
        ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Write a detailed, well-structured chapter for a book about "${topic}". The title of this chapter is "${chapterTitle}". The content should be comprehensive, engaging, and formatted in Markdown.`,
            config: { safetySettings },
        }).then(response => ({
            title: chapterTitle,
            content: response.text || "Content generation for this chapter failed.",
        }))
    );

    const resolvedChapters = await Promise.all(chapterPromises);

    return { title, chapters: resolvedChapters };
};