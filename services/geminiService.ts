
import { GoogleGenAI, Chat, Modality } from "@google/genai";
import type { GeneratedImages, CoverOptions, ChildImage, StorybookContent, StoryName } from '../types.ts';
import { storyCharacterRoles, titles } from './storyData.ts';

/**
 * Helper to get a fresh instance of the AI client.
 * This ensures we pick up any runtime environment changes (like on Vercel).
 */
const getAIClient = () => {
  const apiKey = process.env.API_KEY || (window as any).process?.env?.API_KEY;
  if (!apiKey) {
      throw new Error("API_KEY environment variable not set. Please add it to your environment settings.");
  }
  return new GoogleGenAI({ apiKey });
};

// Preference for models
const TEXT_MODEL = 'gemini-3-flash-preview';
const IMAGE_MODELS = ['gemini-2.5-flash-image', 'imagen-4.0-generate-001'];

const generateImage = async (prompt: string, isIllustration: boolean = false): Promise<string> => {
    const ai = getAIClient();
    const fullPrompt = isIllustration ? `${prompt} vibrant colors, magical, whimsical children's storybook art style.` : prompt;

    for (const modelName of IMAGE_MODELS) {
        try {
            console.log(`Attempting to generate image with model: ${modelName}`);
            
            if (modelName === 'gemini-2.5-flash-image') {
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: { parts: [{ text: fullPrompt }] },
                    config: { responseModalities: [Modality.IMAGE] },
                });

                const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
                if (part?.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            } else if (modelName === 'imagen-4.0-generate-001') {
                const response = await ai.models.generateImages({
                    model: modelName,
                    prompt: fullPrompt,
                    config: { numberOfImages: 1, aspectRatio: "1:1", outputMimeType: 'image/png' },
                });
                if (response.generatedImages?.[0]) {
                    return `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
                }
            }
        } catch (error) {
            console.warn(`Failed with model ${modelName}:`, error);
        }
    }
    throw new Error("Could not generate image. Please check your API usage or try again later.");
};

const generateImageWithImage = async (prompt: string, image: ChildImage, isIllustration: boolean = false): Promise<string> => {
    const ai = getAIClient();
    const fullPrompt = isIllustration ? `${prompt} The final image should be in a vibrant, magical, whimsical children's storybook art style.` : prompt;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: image.base64, mimeType: image.mimeType } },
                { text: fullPrompt },
            ],
        },
        config: { responseModalities: [Modality.IMAGE] },
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Personalized image generation failed.");
}

// --- Coloring Book Service ---

const getColoringBookPrompts = (theme: string, name: string, ageLevel: string, coverOptions: CoverOptions, hasChildImage: boolean) => {
    let baseStyle = "coloring book page for a child, thick clean black outlines, no shading, no color, vector art style, white background.";

    switch(ageLevel) {
        case 'preschool': baseStyle += " very simple shapes, extra thick bold outlines, minimal detail."; break;
        case 'kids': baseStyle += " simple shapes, clear outlines."; break;
        case 'bigkids': baseStyle += " more detailed scenes and characters, varied line thickness."; break;
    }

    const coverFontStyles: Record<string, string> = {
        playful: 'a fun, rounded, playful font',
        bold: 'a modern, bold, sans-serif font',
        cursive: 'an elegant, flowing, cursive script font'
    };
    
    const coverPrompt = `A beautiful coloring book cover for theme "${theme}". Title: "My Awesome Coloring Book". Subtitle: "Made for ${name}". Style: ${coverOptions.template}. Font: ${coverFontStyles[coverOptions.font]}. Primary color: ${coverOptions.color}. ${baseStyle}`;

    const pagePrompts = [
        hasChildImage ?
        `Trace the person from the photo into a clean coloring book character for theme "${theme}". Likeness is vital. Caption: "${name} joins the adventure!". ${baseStyle}` :
        `A large, friendly character from "${theme}". Caption: "${name} meets a new friend!". ${baseStyle}`,
        
        `A simple scene with characters from "${theme}" playing. Caption: "${name} is having fun!". ${baseStyle}`,
        `A simple, easy maze themed around "${theme}". ${baseStyle}`,
        `A connect-the-dots forming a character from "${theme}". ${baseStyle}`,
        `A "find the hidden items" page for "${theme}". Caption: "Can you find these, ${name}?". ${baseStyle}`,
        `The name "${name}" in large, hollow bubble letters with "${theme}" doodles. ${baseStyle}`,
        `A pattern of small items from "${theme}". Caption: "So many cool things, ${name}!". ${baseStyle}`,
        `A "Certificate of Awesome Coloring" award for ${name} with characters from "${theme}". ${baseStyle}`
    ];

    return { cover: coverPrompt, pages: pagePrompts };
};

export const generateColoringBookImages = async (
    theme: string, 
    name: string, 
    ageLevel: string,
    coverOptions: CoverOptions,
    childImage: ChildImage | null,
    onProgress: (message: string, progress: number) => void
): Promise<GeneratedImages> => {
    const prompts = getColoringBookPrompts(theme, name, ageLevel, coverOptions, !!childImage);
    const totalImages = prompts.pages.length + 1;
    let completedImages = 0;

    const updateProgress = (message: string) => {
        completedImages++;
        onProgress(message, Math.round((completedImages / totalImages) * 99));
    };

    onProgress('Painting a spectacular cover...', 5);
    const coverImage = await generateImage(prompts.cover, true);
    updateProgress('Generating the opening page...');

    const pages: string[] = [];
    for (let i = 0; i < prompts.pages.length; i++) {
        const prompt = prompts.pages[i];
        const canUseChildImage = childImage && (i === 0 || i === prompts.pages.length - 1);
        
        const pageImage = canUseChildImage 
            ? await generateImageWithImage(prompt, childImage as ChildImage) 
            : await generateImage(prompt);
            
        pages.push(pageImage);
        updateProgress(`Crafting page ${i + 2}...`);
        
        if (i < prompts.pages.length - 1) {
            await new Promise(r => setTimeout(r, 1000)); // Minimal delay to respect rate limits
        }
    }

    return { coverImage, pages, theme, name };
};

// --- Sticker Maker Service ---

export const generateStickers = async (
    theme: string,
    childImage: ChildImage | null,
    onProgress: (message: string, progress: number) => void
): Promise<string[]> => {
    const ai = getAIClient();
    onProgress('Brainstorming sticker designs...', 10);
    
    const stickerCount = 9;
    const stickerStyle = `cute die-cut sticker, white background, thick vinyl border, cartoon style, vibrant colors, no text. Subject: ${theme}.`;

    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `List 9 distinct sticker ideas for the theme "${theme}". Just the descriptions, numbered.`,
    });

    const stickerIdeas = response.text.split('\n')
        .map(idea => idea.replace(/^\d+\.\s*/, '').trim())
        .filter(idea => idea.length > 0)
        .slice(0, stickerCount);

    const imagePromises = stickerIdeas.map((idea, i) => {
        const prompt = `${idea}. ${stickerStyle}`;
        return (childImage ? generateImageWithImage(prompt, childImage) : generateImage(prompt))
            .then(result => {
                onProgress(`Creating sticker ${i + 1}...`, Math.round(((i + 1) / stickerCount) * 100));
                return result;
            });
    });
    
    return await Promise.all(imagePromises);
};

// --- Story Teller Service ---

export const generatePersonalizedStorybook = async (
    storySelection: StoryName,
    character1Name: string,
    character2Name: string,
    character3Name: string,
    storybookMode: 'classic' | 'personalized',
    childImage: ChildImage | null,
    onProgress: (message: string, progress: number) => void
): Promise<StorybookContent> => {
    const ai = getAIClient();
    onProgress('Dipping the quill in magic ink...', 10);

    const roles = storyCharacterRoles[storySelection];
    const storyPrompt = `Write a 500-word whimsical version of "${storySelection}" for a 6-year-old. 
    Replace original characters: 
    - ${roles.originalChar1} -> ${character1Name}
    - ${roles.originalChar2} -> ${character2Name || roles.originalChar2}
    - ${roles.originalChar3} -> ${character3Name || roles.originalChar3}.
    Break into 5 paragraphs with \n\n.`;

    const textResponse = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: storyPrompt
    });
    const storyText = textResponse.text.trim();

    onProgress('Dreaming up the illustrations...', 30);
    
    const title = titles[storySelection];
    const coverPrompt = `A storybook cover for "${title}" featuring ${character1Name}. Magical, whimsical.`;
    const coverImage = childImage ? await generateImageWithImage(coverPrompt, childImage, true) : await generateImage(coverPrompt, true);

    const illustrations: string[] = [];
    const illCount = 3;
    for(let i=0; i<illCount; i++) {
        onProgress(`Painting scene ${i+1}...`, 40 + (i * 15));
        const illPrompt = `Illustration of ${character1Name} in a key scene from ${storySelection}. Whimsical art style.`;
        illustrations.push(childImage ? await generateImageWithImage(illPrompt, childImage, true) : await generateImage(illPrompt, true));
    }

    return { text: storyText, illustrations, coverImage, title, characters: { character1Name, character2Name, character3Name } };
};

// --- Chatbot Service ---

export const startChat = (): Chat => {
    return getAIClient().chats.create({
        model: TEXT_MODEL,
        config: {
            systemInstruction: 'You are a friendly and encouraging AI assistant for a kids creative studio. Help users with coloring book themes, sticker ideas, or fairy tales. Keep answers simple, magical, and positive.',
        },
    });
};

export const sendMessageToBot = async (chat: Chat, message: string): Promise<string> => {
    const response = await chat.sendMessage({ message });
    return response.text;
};
