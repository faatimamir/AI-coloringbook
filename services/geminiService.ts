import { GoogleGenAI, Chat, Modality } from "@google/genai";
import type { GeneratedImages, CoverOptions, ChildImage, StorybookContent, StoryName } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// List of models for text-to-image generation, in order of preference.
const TEXT_TO_IMAGE_MODELS = [
    'imagen-4.0-generate-001',
    'gemini-2.5-flash-image'
];

const generateImage = async (prompt: string, isIllustration: boolean = false): Promise<string> => {
    // Illustrations benefit from a more artistic touch.
    const fullPrompt = isIllustration ? `${prompt} vibrant colors, magical, whimsical children's storybook art style.` : prompt;

    for (const modelName of TEXT_TO_IMAGE_MODELS) {
        try {
            console.log(`Attempting to generate image with model: ${modelName}`);
            if (modelName === 'imagen-4.0-generate-001') {
                const response = await ai.models.generateImages({
                    model: modelName,
                    prompt: fullPrompt,
                    config: {
                        numberOfImages: 1,
                        aspectRatio: "1:1",
                        outputMimeType: 'image/png',
                    },
                });
                if (response.generatedImages && response.generatedImages.length > 0) {
                    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                    console.log(`Successfully generated image with ${modelName}`);
                    return `data:image/png;base64,${base64ImageBytes}`;
                }
                throw new Error(`Model ${modelName} did not return image data.`);
            } else if (modelName === 'gemini-2.5-flash-image') {
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: {
                        parts: [{ text: fullPrompt }],
                    },
                    config: {
                        responseModalities: [Modality.IMAGE],
                    },
                });

                const parts = response.candidates?.[0]?.content?.parts;
                if (parts) {
                    for (const part of parts) {
                        if (part.inlineData) {
                            const base64ImageBytes: string = part.inlineData.data;
                            console.log(`Successfully generated image with fallback model ${modelName}`);
                            return `data:image/png;base64,${base64ImageBytes}`;
                        }
                    }
                }
                throw new Error(`Model ${modelName} did not return image data.`);
            }
        } catch (error) {
            console.warn(`Failed to generate image with model: ${modelName}. Error:`, error);
        }
    }
    throw new Error("All image generation models failed. Please try again later.");
};


const generateImageWithImage = async (prompt: string, image: ChildImage, isIllustration: boolean = false): Promise<string> => {
    const fullPrompt = isIllustration ? `${prompt} The final image should be in a vibrant, magical, whimsical children's storybook art style.` : prompt;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: image.base64,
                        mimeType: image.mimeType,
                    },
                },
                { text: fullPrompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
    }
    throw new Error("No image generated from gemini-2.5-flash-image");
}


// --- Coloring Book Service ---

const getColoringBookPrompts = (theme: string, name: string, ageLevel: string, coverOptions: CoverOptions, hasChildImage: boolean) => {
    let baseStyle = "coloring book page for a child, thick clean black outlines, no shading, no color, vector art style, white background.";

    switch(ageLevel) {
        case 'preschool':
            baseStyle += " very simple shapes, extra thick bold outlines, minimal detail.";
            break;
        case 'kids':
            baseStyle += " simple shapes, clear outlines.";
            break;
        case 'bigkids':
            baseStyle += " more detailed scenes and characters, varied line thickness.";
            break;
    }

    const coverFontStyles: { [key: string]: string } = {
        playful: 'a fun, rounded, playful font',
        bold: 'a modern, bold, sans-serif font',
        cursive: 'an elegant, flowing, cursive script font'
    };
    const coverTemplateStyles: { [key: string]: string } = {
        illustrated: `storybook illustration style, whimsical characters from the theme of "${theme}" frame the text.`,
        bold: `a modern, graphic design style with clean shapes and high contrast.`,
        soft: `a soft, dreamy, pastel watercolor style with gentle textures.`
    };
    const coverPrompt = `A beautiful coloring book cover with the theme "${theme}". The main title is "My Awesome Coloring Book". A subtitle or area at the bottom says "Made for ${name}". ${coverOptions.dedication ? `Include a small, elegant dedication line: "${coverOptions.dedication}"` : ''} The title font should be ${coverFontStyles[coverOptions.font] || coverFontStyles.playful}. The overall style is ${coverTemplateStyles[coverOptions.template] || coverTemplateStyles.illustrated}. The dominant color for the title text should be close to ${coverOptions.color}. ${baseStyle}`;

    const pagePrompts = [
        hasChildImage ?
        `Accurately trace the person from the provided photo to create a clean, black and white coloring book page. It is essential to capture their exact likeness, facial features, and hair. Do not change their appearance. Place the character in a simple scene related to the theme "${theme}". At the bottom, add the caption: "${name} joins the adventure!". The final image should have thick, clean black outlines, no shading, and a white background.` :
        `A single, large, friendly character from the theme of "${theme}". At the bottom of the page, add the simple caption: "${name} meets a new friend!". ${baseStyle}`,
        
        `A simple scene with two characters from the theme of "${theme}" playing together. At the bottom of the page, add the simple caption: "${name} is having fun!". ${baseStyle}`,
        
        `A simple, easy-to-solve maze for a child. The start and end points should be clear. The maze walls and path should be related to the theme "${theme}". For example, a rocket ship flying through an asteroid maze. ${baseStyle}`,
        
        `A simple connect-the-dots activity for a child, forming a character or object from the theme "${theme}". The dots should be numbered clearly. ${baseStyle}`,
        
        `A "find the hidden items" activity page. In a large scene related to the theme "${theme}", hide 5 simple objects (like a star, a key, a fish). At the bottom of the page, show the 5 small items for the child to find. Caption: "Can you find these items, ${name}?". ${baseStyle}`,
        
        `A coloring page with the name "${name}" written in large, fun, hollow bubble letters that can be colored in. Surround the name with small, simple doodles related to the theme of "${theme}". No other text on the page. ${baseStyle}`,
        
        `A fun pattern made of various small items from the theme of "${theme}". At the bottom of the page, add the simple caption: "So many cool things, ${name}!". ${baseStyle}`,
        
        hasChildImage ?
        `Create a "Certificate of Awesome Coloring" award for ${name}. On the side of the certificate, include the person from the photo, accurately traced as a line-art character cheering. It is essential to preserve their exact likeness and facial features. The certificate should have a large space for ${name}'s name, decorative borders related to the theme "${theme}", and the text "For incredible creativity!". The final image should be a black and white coloring page with thick, clean outlines.` :
        `A "Certificate of Awesome Coloring" award for ${name}. It should have a large space for ${name}'s name to be written, decorative borders related to the theme of "${theme}", and fun characters from the theme cheering. Include the text "For incredible creativity!". ${baseStyle}`
    ];

    return { cover: coverPrompt, pages: pagePrompts };
};

const waitWithProgress = async (durationSeconds: number, onProgress: (message: string, progress: number) => void, currentProgress: number) => {
    for (let i = durationSeconds; i > 0; i--) {
        onProgress(`Pausing to avoid rate limits... (${i}s remaining)`, currentProgress);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
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
    const totalImages = prompts.pages.length + 1; // +1 for the cover
    let completedImages = 0;

    const updateProgress = (message: string) => {
        completedImages++;
        const percent = Math.round((completedImages / totalImages) * 100);
        onProgress(message, percent > 99 ? 99 : percent); // Cap at 99 until fully done
    };

    onProgress('Generating spectacular cover image...', 0);
    const coverImage = await generateImage(prompts.cover, true); // Cover is an illustration
    updateProgress('Generating personalized character page...');

    const pages: string[] = [];

    for (let i = 0; i < prompts.pages.length; i++) {
        const prompt = prompts.pages[i];
        let pageImage: string;

        // The first and last pages are special and can use the child's image
        const canUseChildImage = childImage && (i === 0 || i === prompts.pages.length - 1);

        if (canUseChildImage) {
            pageImage = await generateImageWithImage(prompt, childImage as ChildImage);
        } else {
            pageImage = await generateImage(prompt);
        }

        pages.push(pageImage);

        // Update progress with a descriptive message
        const pageDescriptions = [
            "Crafting a fun scene...",
            "Designing an amazing maze...",
            "Connecting the dots...",
            "Hiding treasure...",
            "Tracing your name...",
            "Creating a cool pattern...",
            "Making your coloring award..."
        ];
        const nextMessage = pageDescriptions[i] || `Generating page ${i + 2}...`;
        updateProgress(nextMessage);

        // Pause between image generations to avoid hitting rate limits
        if (i < prompts.pages.length - 1) {
            await waitWithProgress(2, onProgress, Math.round((completedImages / totalImages) * 100));
        }
    }

    onProgress('Almost there...', 99);

    return {
        coverImage,
        pages,
        theme,
        name,
    };
};

// --- Sticker Maker Service ---

export const generateStickers = async (
    theme: string,
    childImage: ChildImage | null,
    onProgress: (message: string, progress: number) => void
): Promise<string[]> => {
    onProgress('Brainstorming sticker ideas...', 0);
    
    const stickerCount = 9;
    
    const stickerStyle = `cute die-cut sticker, white background, thick vinyl border, cartoon style, vibrant colors, no text, simple illustration. The subject is a character or object related to "${theme}".`;

    const basePrompt = `Generate a variety of ${stickerCount} distinct sticker ideas based on the theme "${theme}". Describe each one very briefly in a numbered list. For example: 1. A smiling planet Saturn. 2. A happy rocket ship.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: basePrompt,
    });

    const stickerIdeasText = response.text;
    const stickerIdeas = stickerIdeasText.split('\n').map(idea => idea.replace(/^\d+\.\s*/, '').trim()).filter(idea => idea.length > 0);

    onProgress('Bringing sticker ideas to life...', 20);

    const imagePromises: Promise<string>[] = [];
    const totalProgressSteps = stickerCount + 1; // 1 for idea generation

    for (let i = 0; i < stickerCount; i++) {
        const idea = stickerIdeas[i] || `A cute character from "${theme}"`;
        const prompt = `${idea}. ${stickerStyle}`;
        
        const promise = (childImage ? generateImageWithImage(prompt, childImage) : generateImage(prompt))
            .then(result => {
                const percent = Math.round(((i + 2) / totalProgressSteps) * 100);
                onProgress(`Creating sticker ${i + 1} of ${stickerCount}...`, percent);
                return result;
            });
        
        imagePromises.push(promise);
    }
    
    const stickerImages = await Promise.all(imagePromises);
    onProgress('Your stickers are ready!', 100);
    return stickerImages;
};


// --- Story Teller Service ---

export const storyCharacterRoles = {
  cinderella: {
    originalChar1: 'Cinderella',
    originalChar2: 'The Prince',
    char3Role: 'Fairy Godmother',
    originalChar3: 'Fairy Godmother'
  },
  snow_white: {
    originalChar1: 'Snow White',
    originalChar2: 'The Prince',
    char3Role: 'Evil Queen',
    originalChar3: 'The Queen'
  },
  jack_beanstalk: {
    originalChar1: 'Jack',
    originalChar2: 'The Giant',
    char3Role: 'Jack\'s Mother',
    originalChar3: 'Jack\'s Mother'
  },
  three_pigs: {
    originalChar1: 'The Smart Pig',
    originalChar2: 'The Big Bad Wolf',
    char3Role: 'The Other Two Pigs',
    originalChar3: 'His Two Siblings'
  },
  goldilocks: {
    originalChar1: 'Goldilocks',
    originalChar2: 'Papa Bear',
    char3Role: 'Mama & Baby Bear',
    originalChar3: 'The Rest of the Family'
  },
  red_riding_hood: {
    originalChar1: 'Little Red Riding Hood',
    originalChar2: 'The Big Bad Wolf',
    char3Role: 'The Woodsman',
    originalChar3: 'The Woodsman'
  }
};

const getStoryPrompt = (
    storySelection: StoryName, 
    character1Name: string, 
    character2Name: string, 
    character3Name: string
) => {
    const story = storyCharacterRoles[storySelection];
    const char1 = character1Name || story.originalChar1;
    const char2 = character2Name || story.originalChar2;
    const char3 = character3Name || story.originalChar3;

    return `Write a short, personalized version of the classic fairy tale "${storySelection}", suitable for a young child (around 5-7 years old). The story should be approximately 500-600 words long and divided into 5-6 paragraphs, separated by double newlines (\n\n).

    Please replace the original characters with the following names:
    - The main character (originally ${story.originalChar1}) is now named "${char1}".
    - The second character (originally ${story.originalChar2}) is now named "${char2}".
    - The third character (originally ${story.originalChar3}, the ${story.char3Role}) is now named "${char3}".

    Keep the core plot of the story, but feel free to simplify the language and make the tone warm, positive, and magical. Focus on themes of kindness, bravery, and friendship. Do not include any scary or overly dramatic elements.

    The final output should be ONLY the text of the story. Do not add any titles, headings, or introductory phrases like "Here is the story:".
    `;
};

const getIllustrationPromptsFromStory = async (storyText: string): Promise<string[]> => {
    const prompt = `Based on the following children's story, create three short, simple, one-sentence prompts for illustrations. Each prompt should describe a key visual moment from the story. The prompts should be in a numbered list.

    For example:
    1. A brave knight stands before a friendly dragon.
    2. The knight and dragon fly over a castle.
    3. They share a cup of tea in a sunny field.

    Story:
    ---
    ${storyText}
    ---
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text.split('\n').map(p => p.replace(/^\d+\.\s*/, '').trim()).filter(p => p);
};


export const generatePersonalizedStorybook = async (
    storySelection: StoryName,
    character1Name: string,
    character2Name: string,
    character3Name: string,
    storybookMode: 'classic' | 'personalized',
    childImage: ChildImage | null,
    onProgress: (message: string, progress: number) => void
): Promise<StorybookContent> => {
    onProgress('Gathering enchanted ink and paper...', 0);

    const storyPrompt = getStoryPrompt(storySelection, character1Name, character2Name, character3Name);
    const textResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: storyPrompt
    });
    const storyText = textResponse.text.trim();

    onProgress('Writing your magical tale...', 25);
    
    const titles: Record<StoryName, string> = {
        cinderella: "Cinderella's Magical Night",
        snow_white: "Snow White's Forest Friends",
        jack_beanstalk: "Jack's Giant Adventure",
        three_pigs: "The Three Pigs' Great Escape",
        goldilocks: "Goldilocks and the Just Right Day",
        red_riding_hood: "Red Riding Hood's Forest Path"
    };
    const title = titles[storySelection];

    const characters = { character1Name, character2Name, character3Name };
    
    const illustrationPromises: Promise<string>[] = [];
    const totalSteps = (storybookMode === 'personalized' ? 3 : 3) + 2; // text, cover + 3 illustrations

    // Generate cover
    const coverPrompt = `A beautiful, enchanting children's storybook cover for a story titled "${title}". The scene should be magical and whimsical, reflecting the theme of ${storySelection}. ${childImage ? `The main character should be based on the person in the provided photo.` : `The main character, ${character1Name}, should be featured prominently.`}`;
    const coverPromise = (childImage ? generateImageWithImage(coverPrompt, childImage, true) : generateImage(coverPrompt, true))
        .then(result => {
            onProgress('Designing the storybook cover...', Math.round((2 / totalSteps) * 100));
            return result;
        });

    let illustrations: string[] = [];

    if (storybookMode === 'personalized') {
        onProgress('Dreaming up illustrations...', Math.round((2 / totalSteps) * 100));
        const illustrationPrompts = await getIllustrationPromptsFromStory(storyText);
        
        for (let i = 0; i < 3; i++) {
            const prompt = illustrationPrompts[i] || `A key scene from the story of ${title} featuring ${character1Name}.`;
            const fullPrompt = `${prompt} ${childImage ? `The main character should look like the person in the provided photo.` : ''}`;
            
            const promise = (childImage ? generateImageWithImage(fullPrompt, childImage, true) : generateImage(fullPrompt, true))
                .then(result => {
                    onProgress(`Painting illustration ${i + 1}...`, Math.round(((i + 3) / totalSteps) * 100));
                    return result;
                });
            illustrationPromises.push(promise);
        }
        illustrations = await Promise.all(illustrationPromises);
    } else {
        // For 'classic' mode, we'll still generate illustrations to satisfy the PDF generator.
        onProgress('Finding classic illustrations...', 50);
        const classicPrompts = [
            `A scene of ${character1Name} from the story of ${storySelection}, in a classic fairytale illustration style.`,
            `A scene of ${character1Name} and ${character2Name || 'another character'} from the story of ${storySelection}, in a classic fairytale illustration style.`,
            `A happy ending scene for ${character1Name} from the story of ${storySelection}, in a classic fairytale illustration style.`,
        ];
        for (let i = 0; i < 3; i++) {
            const promise = generateImage(classicPrompts[i], true).then(result => {
                 onProgress(`Polishing illustration ${i + 1}...`, 60 + (i * 10));
                 return result;
            });
            illustrationPromises.push(promise);
        }
        illustrations = await Promise.all(illustrationPromises);
    }

    const coverImage = await coverPromise;
    
    onProgress('Binding the book...', 95);
    
    return {
        text: storyText,
        illustrations,
        coverImage,
        title,
        characters,
    };
};

// --- Chatbot Service ---

export const startChat = (): Chat => {
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: 'You are a friendly and helpful AI assistant for a creative app that generates coloring books, stickers, and stories for kids. Your tone should be encouraging and positive. You can answer questions about the app, suggest creative ideas, or have a fun chat with the user.',
        },
    });
    return chat;
};

export const sendMessageToBot = async (chat: Chat, message: string): Promise<string> => {
    const response = await chat.sendMessage({ message });
    return response.text;
};