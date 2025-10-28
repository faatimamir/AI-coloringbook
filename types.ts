
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

// Data passed from the form can vary depending on the mode
export interface GenerationFormData {
  theme: string;
  childImage: ChildImage | null;
  // Coloring Book specific
  name?: string;
  ageLevel?: string;
  coverOptions?: CoverOptions;
  // Story Teller specific
  storySelection?: string;
  character1Name?: string;
  character2Name?: string;
  character3Name?: string;
}
