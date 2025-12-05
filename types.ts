export enum Language {
  CHINESE = 'CHINESE',
  ENGLISH = 'ENGLISH'
}

export enum Mode {
  VOCABULARY = 'VOCABULARY',
  PASSAGE = 'PASSAGE'
}

export enum AppState {
  USER_SELECT = 'USER_SELECT',
  MENU = 'MENU',
  LIBRARY = 'LIBRARY',
  HISTORY = 'HISTORY',
  SETUP = 'SETUP',
  DICTATION = 'DICTATION',
  FINISHED = 'FINISHED',
  WORKSHEET = 'WORKSHEET'
}

export interface DictationItem {
  id: string;
  text: string;     // The text to display/reference
  spokenText?: string; // The text to actually speak (e.g. "Comma" instead of ",")
  audioBlob?: Blob; // Optional parent recording
}

export interface DictationConfig {
  language: Language;
  mode: Mode;
  durationSeconds: number; // 0 for no limit
  items: DictationItem[];
}

export interface SavedDictation {
  id: string;
  title: string;
  language: Language;
  mode: Mode;
  items: DictationItem[];
  createdAt: number;
}

export interface HistoryItem {
  id: string;
  date: number;
  language: Language;
  mode: Mode;
  itemCount: number;
  durationPlayed: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string; // Emoji char or Base64 string or URL
  isCustom: boolean; // true if uploaded image
  themeColor?: string;
}
