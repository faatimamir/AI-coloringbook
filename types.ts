// FIX: Define a specific `StoryName` type for story selections to ensure type safety.
// This was previously `string`, which caused a type mismatch error when
// calling the story generation service in `App.tsx`.
export type StoryName = 'cinderella' | 'snow_white' | 'jack_beanstalk';

export interface GeneratedImages {
  coverImage: string;
  pages: string[];
  theme: string;
  name: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface CoverOptions {
  template: string;
  color: string;
  font: string;
  dedication: string;
}

export interface ChildImage {
  base64: string;
  mimeType: string;
}

export interface StorybookContent {
  text: string;
  illustrations: string[];
  coverImage: string;
  title: string;
  characters: { 
    character1Name: string;
    character2Name?: string;
    character3Name?: string;
  };
}

// Data passed from the form can vary depending on the mode
export interface GenerationFormData {
  theme: string;
  childImage: ChildImage | null;
  // Coloring Book specific
  name?: string;
  ageLevel?: string;
  coverOptions?: CoverOptions;
  // Story Teller specific
  storySelection?: StoryName;
  character1Name?: string;
  character2Name?: string;
  character3Name?: string;
  storybookMode?: 'classic' | 'personalized';
}
