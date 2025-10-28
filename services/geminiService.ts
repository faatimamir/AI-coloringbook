
import { GoogleGenAI, Chat, Modality } from "@google/genai";
import type { GeneratedImages, CoverOptions, ChildImage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateImage = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            aspectRatio: "1:1",
            outputMimeType: 'image/png',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
}

const generateImageWithImage = async (prompt: string, image: ChildImage): Promise<string> => {
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
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
    }
    throw new Error("No image generated from gemini-2.5-flash-image");
}


const getPrompts = (theme: string, name: string, ageLevel: string, coverOptions: CoverOptions, hasChildImage: boolean) => {
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
        `Redraw the person in this photo as a line-art coloring book character. Place them in a simple scene related to the theme "${theme}". The character should be the main focus. At the bottom of the page, add the simple caption: "${name} joins the adventure!". ${baseStyle}` :
        `A single, large, friendly character from the theme of "${theme}". At the bottom of the page, add the simple caption: "${name} meets a new friend!". ${baseStyle}`,
        
        `A simple scene with two characters from the theme of "${theme}" playing together. At the bottom of the page, add the simple caption: "${name} is having fun!". ${baseStyle}`,
        
        `A simple, easy-to-solve maze for a child. The start and end points should be clear. The maze walls and path should be related to the theme "${theme}". For example, a rocket ship flying through an asteroid maze. ${baseStyle}`,
        
        `A simple connect-the-dots activity for a child, forming a character or object from the theme "${theme}". The dots should be numbered clearly. ${baseStyle}`,
        
        `A "find the hidden items" activity page. In a large scene related to the theme "${theme}", hide 5 simple objects (like a star, a key, a fish). At the bottom of the page, show the 5 small items for the child to find. Caption: "Can you find these items, ${name}?". ${baseStyle}`,
        
        `A coloring page with the name "${name}" written in large, fun, hollow bubble letters that can be colored in. Surround the name with small, simple doodles related to the theme of "${theme}". No other text on the page. ${baseStyle}`,
        
        `A fun pattern made of various small items from the theme of "${theme}". At the bottom of the page, add the simple caption: "So many cool things, ${name}!". ${baseStyle}`,
        
        hasChildImage ?
        `Create a "Certificate of Awesome Coloring" award for ${name}. Redraw the person from the photo as a line-art coloring book character, cheering on the side of the certificate. It should have a large space for ${name}'s name to be written, decorative borders related to the theme "${theme}". Include the text "For incredible creativity!". ${baseStyle}` :
        `A "Certificate of Awesome Coloring" award for ${name}. It should have a large space for ${name}'s name to be written, decorative borders related to the theme of "${theme}", and fun characters from the theme cheering. Include the text "For incredible creativity!". ${baseStyle}`
    ];

    return { cover: coverPrompt, pages: pagePrompts };
};

export const generateColoringBookImages = async (
    theme: string, 
    name: string, 
    ageLevel: string,
    coverOptions: CoverOptions,
    childImage: ChildImage | null
): Promise<GeneratedImages> => {
    const prompts = getPrompts(theme, name, ageLevel, coverOptions, !!childImage);
    
    // Total 9 images now (1 cover + 8 pages)
    const imagePromises: Promise<string>[] = [];

    // Cover (always uses imagen)
    imagePromises.push(generateImage(prompts.cover));

    // Pages
    prompts.pages.forEach((p, index) => {
        // Indices 0 (character) and 7 (award) are personalized
        if (childImage && (index === 0 || index === 7)) {
            imagePromises.push(generateImageWithImage(p, childImage));
        } else {
            imagePromises.push(generateImage(p));
        }
    });

    const [coverImage, ...pageImages] = await Promise.all(imagePromises);

    return {
        coverImage: coverImage,
        pages: pageImages,
        theme,
        name
    };
};


// --- Chat Service ---
export const startChat = (): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: 'You are Colory, the friendly robot helper from the magical world of coloring! Your job is to chat with kids and their parents and make them smile. Be super friendly, cheerful, and use simple, happy words. If they ask how the coloring book is made, you can say something like: "My grown-up friends use a little bit of computer magic to draw special pictures just for you! You tell them a theme, like \'space dinosaurs,\' and your name, and poof! They create a whole book you can print and color!"',
        },
    });
};

export const sendMessageToBot = async (chat: Chat, message: string): Promise<string> => {
    const response = await chat.sendMessage({ message });
    return response.text;
};
