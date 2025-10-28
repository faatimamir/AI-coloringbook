
import { GoogleGenAI, Chat, Modality } from "@google/genai";
import type { GeneratedImages, CoverOptions, ChildImage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// List of models for text-to-image generation, in order of preference.
const TEXT_TO_IMAGE_MODELS = [
    'imagen-4.0-generate-001',
    'gemini-2.5-flash-image'
];

const generateImage = async (prompt: string): Promise<string> => {
    for (const modelName of TEXT_TO_IMAGE_MODELS) {
        try {
            console.log(`Attempting to generate image with model: ${modelName}`);
            if (modelName === 'imagen-4.0-generate-001') {
                const response = await ai.models.generateImages({
                    model: modelName,
                    prompt: prompt,
                    config: {
                        numberOfImages: 1,
                        aspectRatio: "1:1",
                        outputMimeType: 'image/png',
                    },
                });
                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                console.log(`Successfully generated image with ${modelName}`);
                return `data:image/png;base64,${base64ImageBytes}`;
            } else if (modelName === 'gemini-2.5-flash-image') {
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: {
                        parts: [{ text: prompt }],
                    },
                    config: {
                        responseModalities: [Modality.IMAGE],
                    },
                });

                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        const base64ImageBytes: string = part.inlineData.data;
                        console.log(`Successfully generated image with fallback model ${modelName}`);
                        return `data:image/png;base64,${base64ImageBytes}`;
                    }
                }
                // If gemini-2.5-flash-image doesn't return an image, it's a failure for this model.
                throw new Error(`Model ${modelName} did not return image data.`);
            }
        } catch (error) {
            console.warn(`Failed to generate image with model: ${modelName}. Error:`, error);
            // If it's the last model in the list, the error will be thrown after the loop.
        }
    }
    // If the loop completes without returning, all models have failed.
    throw new Error("All image generation models failed. Please try again later.");
};


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
    
    const allPrompts = [
        { prompt: prompts.cover, isPersonalized: false, type: 'Cover' },
        ...prompts.pages.map((p, i) => ({
            prompt: p,
            isPersonalized: !!childImage && (i === 0 || i === 7),
            type: `Page ${i + 1}`
        }))
    ];
    
    const totalImages = allPrompts.length;
    const generatedImagesData: string[] = [];
    const RATE_LIMIT_CHUNK_SIZE = 2;
    const RATE_LIMIT_WAIT_SECONDS = 60;

    for (let i = 0; i < totalImages; i++) {
        if (i > 0 && i % RATE_LIMIT_CHUNK_SIZE === 0) {
            const progress = (i / totalImages) * 100;
            await waitWithProgress(RATE_LIMIT_WAIT_SECONDS, onProgress, progress);
        }
        
        const currentTask = allPrompts[i];
        const progress = (i / totalImages) * 100;
        onProgress(`Generating ${currentTask.type} (${i + 1}/${totalImages})...`, progress);

        let imageUrl: string;
        if (currentTask.isPersonalized && childImage) {
            imageUrl = await generateImageWithImage(currentTask.prompt, childImage);
        } else {
            imageUrl = await generateImage(currentTask.prompt);
        }
        generatedImagesData.push(imageUrl);
    }
    
    onProgress('Finishing up...', 99);

    const coverImage = generatedImagesData.shift() || '';
    
    return {
        coverImage: coverImage,
        pages: generatedImagesData,
        theme,
        name
    };
};


// --- Sticker Service ---
export const generateStickers = async (
    theme: string,
    childImage: ChildImage | null,
    onProgress: (message: string, progress: number) => void
): Promise<string[]> => {
    const STICKER_COUNT = 6;
    const stickerPrompts: { prompt: string; isPersonalized: boolean }[] = [];
    const baseStyle = "a vibrant, colorful, die-cut sticker with a thick white border, cartoon style, white background, high quality.";

    if (childImage) {
        // Create a mix of personalized and general stickers
        stickerPrompts.push({
            prompt: `Redraw the person in this photo as a cute cartoon character sticker. The character should be related to the theme of "${theme}". ${baseStyle}`,
            isPersonalized: true
        });
        stickerPrompts.push({
            prompt: `A cute sticker of an animal related to the theme "${theme}". ${baseStyle}`,
            isPersonalized: false
        });
        stickerPrompts.push({
            prompt: `Redraw the person in this photo as a fun cartoon character sticker, waving happily. The character's outfit should match the theme "${theme}". ${baseStyle}`,
            isPersonalized: true
        });
        stickerPrompts.push({
            prompt: `A cute sticker of a food item related to the theme "${theme}". ${baseStyle}`,
            isPersonalized: false
        });
         stickerPrompts.push({
            prompt: `A fun sticker of an object from the theme "${theme}". ${baseStyle}`,
            isPersonalized: false
        });
        stickerPrompts.push({
            prompt: `Redraw the person in this photo as a funny cartoon character sticker making a silly face, surrounded by small doodles from the theme "${theme}". ${baseStyle}`,
            isPersonalized: true
        });
    } else {
        // Generate a variety of general stickers
        for (let i = 0; i < STICKER_COUNT; i++) {
            stickerPrompts.push({
                prompt: `A cute, fun sticker of a character or object related to the theme "${theme}". Sticker ${i + 1} of ${STICKER_COUNT}. ${baseStyle}`,
                isPersonalized: false
            });
        }
    }

    const generatedStickers: string[] = [];
    for (let i = 0; i < STICKER_COUNT; i++) {
        const progress = (i / STICKER_COUNT) * 100;
        onProgress(`Generating Sticker ${i + 1} of ${STICKER_COUNT}...`, progress);
        
        const currentTask = stickerPrompts[i];
        let imageUrl: string;
        if (currentTask.isPersonalized && childImage) {
            imageUrl = await generateImageWithImage(currentTask.prompt, childImage);
        } else {
            imageUrl = await generateImage(currentTask.prompt);
        }
        generatedStickers.push(imageUrl);
    }
    
    onProgress('All done!', 100);
    return generatedStickers;
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

// --- Story Teller Service ---
export const storyCharacterRoles = {
    cinderella: { originalChar1: 'Cinderella', originalChar2: 'The Prince', originalChar3: 'The Fairy Godmother', char3Role: 'The Magical Helper' },
    snow_white: { originalChar1: 'Snow White', originalChar2: 'The Prince', originalChar3: 'The Evil Queen', char3Role: 'The Jealous Stepmother' },
    jack_beanstalk: { originalChar1: 'Jack', originalChar2: 'The Giant', originalChar3: "Jack's Mother", char3Role: 'The Worried Parent' },
};

// A library of classic stories, expanded to be much longer.
const storyTemplates: { [key: string]: { text: string } } = {
    cinderella: {
        text: `In a kingdom of green hills and sparkling rivers, there lived a gentle and kind-hearted girl named Cinderella. Her spirit was as bright as the morning sun, though her life was often filled with shadows. She lived in a large house with her stepmother and two stepsisters, who were not kind at all. They treated Cinderella not as family, but as a servant, making her cook, clean, and mend their clothes from dawn until dusk. Despite their cruelty, Cinderella remained hopeful, often dreaming of a life filled with warmth and happiness.

One bright afternoon, a royal messenger arrived with a proclamation. The King was holding a magnificent royal ball in honor of the Prince, and every eligible maiden in the kingdom was invited. Cinderella's stepsisters were ecstatic, chattering endlessly about the gowns they would wear and the dances they would have. Cinderella's heart fluttered with a secret wish to attend, but her stepmother just laughed. "You, at the ball? In your rags? Impossible!" she declared, giving Cinderella an impossibly long list of chores to complete.

As her stepsisters and stepmother departed for the ball in a flurry of silk and perfume, Cinderella sat by the hearth, her dreams turning to dust. A single tear traced a path through the soot on her cheek. Suddenly, the room filled with a soft, shimmering light. Before her stood a woman with a kind smile and a silver wand—it was the Fairy Godmother! "Don't you worry, my dear," she said gently. "You shall go to the ball."

With a series of magical flicks of her wand, the Fairy Godmother transformed a plump pumpkin into a grand, golden carriage. Four little mice became four noble white horses, and a friendly rat became a stately coachman. For the final touch, she tapped Cinderella's tattered dress, which dissolved into a breathtaking ball gown of starlight and moonbeams, with delicate glass slippers on her feet. "There is one rule," the Fairy Godmother warned. "You must leave the ball before the clock strikes midnight, for then the spell will end."

Cinderella arrived at the palace, and every head turned. No one recognized the lovely girl from the cinders. The Prince himself was instantly enchanted. He asked her to dance, and for the rest of the evening, he had eyes for no one else. They danced and laughed, and for a few precious hours, Cinderella felt like she was living in her most beautiful dream. But as the grand clock began to chime for midnight, she remembered the warning. She hurried from the ballroom, leaving the Prince calling after her. In her haste, one of her glass slippers fell off on the palace steps.

The Prince, holding the tiny glass slipper, was heartbroken but determined. He vowed to find the mysterious maiden who had captured his heart. He and his royal court traveled the kingdom, having every woman try on the slipper. It fit none of them. Finally, they arrived at Cinderella's house. The stepsisters tried desperately to squeeze their feet into the delicate shoe, but it was no use. Just as the royal party was about to leave, the captain of the guard noticed Cinderella sitting quietly in the corner. Though her stepmother protested, the slipper was brought to her. It slid onto her foot perfectly. At that moment, the Prince knew he had found his true love. Cinderella was brought to the palace, where she and the Prince were married in a grand ceremony, and they lived together in joy and kindness, happily ever after.`
    },
    snow_white: {
        text: `Once upon a time, in the heart of a kingdom blessed with snowy winters and sunny summers, lived a princess so fair that her skin was as white as snow, her lips as red as blood, and her hair as black as ebony. Her name was Snow White, and her gentle nature made her beloved by all... except for one. Her stepmother, the Evil Queen, was a woman of stunning beauty, but her heart was cold and filled with vanity. Every day, she would consult her magic mirror, asking, "Magic mirror on the wall, who is the fairest one of all?" And every day, the mirror would reply, "You, my Queen, are fairest of all."

But as Snow White grew, so did her beauty. One day, the Queen asked her mirror the same question, but this time, the answer was different. "My Queen, you are fair, it's true. But Snow White is a thousand times fairer than you." Consumed by a furious jealousy, the Evil Queen could no longer bear the sight of Snow White. She secretly summoned a huntsman and commanded him to take the princess deep into the woods and end her life, bringing back her heart as proof.

The huntsman, however, was a good man. When he looked upon Snow White's innocent face, he found he could not harm her. "Run away, child!" he urged her. "Flee into the forest and never return!" Terrified, Snow White ran as fast as she could, deeper and deeper into the dark woods. She ran until her legs could carry her no more, finally collapsing in a small, sunlit clearing. There, she found a charming little cottage, built for someone of a very small size.

Hesitantly, she knocked. When no one answered, she crept inside and found a cozy room with seven small beds, seven small chairs, and a table set for seven. Exhausted, she tidied up the little house and then fell fast asleep across three of the tiny beds. That evening, the owners of the cottage returned from their work in the mines. They were seven dwarfs, each with a long beard and a kind heart. They were surprised to find the lovely princess asleep in their home, but when she awoke and told them her sad story, they took pity on her and invited her to stay with them, promising to keep her safe.

Meanwhile, back at the castle, the Evil Queen once again consulted her mirror. To her horror, the mirror revealed, "Over the seven jeweled hills, beyond the seventh fall, in the cottage of the seven dwarfs, Snow White is fairest of all." Realizing she had been tricked, the Queen used her dark magic to disguise herself as an old, stooped peddler woman. She crafted a beautiful, shiny apple, perfect on one side but poisoned with a sleeping curse on the other. She journeyed to the dwarfs' cottage and offered the apple to Snow White as a gift. Wary at first, Snow White took a bite after the old woman took a bite from the safe side. Instantly, the poison took hold, and she fell to the floor in a sleep so deep it was like death.

When the dwarfs returned, they were devastated. They could not revive their beloved Snow White. Unwilling to bury her in the cold ground, they built a beautiful coffin of glass and gold and placed her inside, keeping watch over her day and night. A long time passed, and one day, a noble Prince from a neighboring kingdom was riding through the forest. He saw the glass coffin and was struck by the beauty of the sleeping princess. He begged the dwarfs to let him take her back to his castle. As his servants lifted the coffin to carry it away, one of them stumbled. The jolt dislodged the piece of poisoned apple from Snow White's throat, and she awoke, blinking in the sunlight. The spell was broken. The Prince was overjoyed and asked Snow White to be his bride. They were married and ruled their kingdom with kindness and grace, living happily ever after.`
    },

    jack_beanstalk: {
        text: `In a small, weathered cottage at the edge of a village lived a young boy named Jack and his dear Mother. They had fallen on hard times, and their pantry grew emptier with each passing day. Their only remaining possession of value was their gentle milk cow, Milky-White. One morning, with a heavy heart, Jack's Mother told him, "Jack, we have no choice. You must take Milky-White to the market and sell her so we can buy food."

Jack was a good-natured boy, though a bit of a dreamer. He set off on the road to the market, leading Milky-White by a rope. Along the way, he met a strange little man with a twinkle in his eye and a long, grey beard. The man saw the cow and offered Jack a trade. "I will give you these," he said, opening his palm to reveal five colorful, shimmering beans. "These are no ordinary beans, my boy. They are magic!" Jack, forgetting all about the market and the money, was so intrigued by the idea of magic that he made the trade immediately.

When he returned home with only a handful of beans, Jack's Mother was overcome with despair and anger. "You foolish boy!" she cried. "You've traded our only hope for a few worthless beans!" In her frustration, she threw the beans out the cottage window and sent Jack to bed without any supper. The next morning, Jack awoke to a strange sight. Outside his window, where the beans had landed, a colossal beanstalk had sprung up, its thick, green stalk twisting up through the clouds and disappearing from sight.

Filled with a sense of wonder and adventure, Jack decided to climb the enormous plant. He climbed for hours, past birds and clouds, until he reached the very top. There, in a land above the sky, he saw a massive castle. Cautiously, he approached and slipped through the giant door. The castle was the home of a fearsome Giant, a towering figure with a booming voice and a terrible temper. Hiding in a cupboard, Jack watched as the Giant ate his enormous meal and then commanded his treasures to appear. He had a hen that laid perfect, solid gold eggs and a small, magical harp that played the most beautiful music all by itself.

When the Giant fell into a deep, rumbling sleep, Jack saw his chance. He crept out, snatched the hen that laid golden eggs, and scrambled back down the beanstalk as fast as he could. His mother was overjoyed, and for a while, the golden eggs provided them with everything they needed. But Jack's adventurous spirit was not satisfied. He climbed the beanstalk a second time. This time, he waited for the Giant to sleep and stole the magical harp.

But as Jack made his escape, the little harp cried out, "Master! Master!" The Giant awoke with a mighty roar and saw Jack running away with his prized possession. The Giant leaped from his chair and gave chase. Jack scrambled down the beanstalk, the Giant's heavy footsteps shaking the very stalk behind him. "Mother! Quick, bring the axe!" Jack shouted as he neared the ground. He leaped from the final branches, grabbed the axe from his waiting mother, and began to chop at the base of the beanstalk with all his might. With a final, mighty swing, the stalk snapped. There was a tremendous, earth-shaking crash as the Giant and the beanstalk came tumbling down. That was the end of the Giant. From that day on, Jack and his Mother lived a comfortable and happy life, thanks to their magical treasures.`
    },
};


export const generatePersonalizedStory = async (
    storySelection: string,
    character1Name: string,
    character2Name: string,
    character3Name: string
): Promise<string> => {
    const storyInfo = storyCharacterRoles[storySelection];
    const storyTemplate = storyTemplates[storySelection];
    if (!storyTemplate || !storyInfo) {
        throw new Error("Invalid story selection.");
    }

    let replacements = `Replace the name "${storyInfo.originalChar1}" with "${character1Name}".`;
    if (storyInfo.originalChar2 && character2Name.trim()) {
        replacements += ` Also, replace the name or title "${storyInfo.originalChar2}" with "${character2Name}".`;
    }
    if (storyInfo.originalChar3 && character3Name.trim()) {
        replacements += ` Finally, replace the name or title "${storyInfo.originalChar3}" with "${character3Name}".`;
    }

    const prompt = `You are a master storyteller. Your task is to rewrite the following classic story. ${replacements} Make the replacements seamless and natural throughout the entire text, ensuring grammar and pronouns are correct. Do not add any new plot points or change the story's meaning. Just perform the name replacements.

Here is the story:
---
${storyTemplate.text}
---
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text.trim();
};
