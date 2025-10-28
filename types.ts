
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
