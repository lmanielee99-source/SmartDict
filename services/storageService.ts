import { Language, Mode, DictationItem, SavedDictation, HistoryItem, UserProfile } from '../types';

const USERS_KEY = 'smartdict_users';
const PRESETS_PREFIX = 'smartdict_presets_';
const HISTORY_PREFIX = 'smartdict_history_';
const DRAFT_PREFIX = 'smartdict_draft_';

// --- User Management ---

export const getUsers = (): UserProfile[] => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const createUser = (name: string, avatar: string, isCustom: boolean): UserProfile => {
  const users = getUsers();
  const newUser: UserProfile = {
    id: Date.now().toString(),
    name,
    avatar,
    isCustom,
    themeColor: 'blue' // Default
  };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
  return newUser;
};

export const deleteUser = (userId: string) => {
  const users = getUsers();
  const updated = users.filter(u => u.id !== userId);
  localStorage.setItem(USERS_KEY, JSON.stringify(updated));
  
  // Cleanup user data
  localStorage.removeItem(`${PRESETS_PREFIX}${userId}`);
  localStorage.removeItem(`${HISTORY_PREFIX}${userId}`);
  // Drafts are harder to clean perfectly without listing all, but they are small text strings. 
  // We can leave them or implement a more complex key tracking if needed. 
  // For now, let's leave drafts as they overwrite.
};

// --- Presets (Library) ---

export const getSavedDictations = (userId: string): SavedDictation[] => {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${PRESETS_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load presets", e);
    return [];
  }
};

export const saveDictationToLibrary = (
  userId: string,
  title: string,
  language: Language,
  mode: Mode,
  items: DictationItem[]
): SavedDictation => {
  const presets = getSavedDictations(userId);
  const newPreset: SavedDictation = {
    id: Date.now().toString(),
    title: title || (language === Language.CHINESE ? '未命名默書' : 'Untitled Dictation'),
    language,
    mode,
    items,
    createdAt: Date.now(),
  };
  
  const updated = [newPreset, ...presets];
  localStorage.setItem(`${PRESETS_PREFIX}${userId}`, JSON.stringify(updated));
  return newPreset;
};

export const deleteSavedDictation = (userId: string, id: string) => {
  const presets = getSavedDictations(userId);
  const updated = presets.filter(p => p.id !== id);
  localStorage.setItem(`${PRESETS_PREFIX}${userId}`, JSON.stringify(updated));
};

// --- History ---

export const saveHistoryItem = (userId: string, language: Language, mode: Mode, itemCount: number, durationPlayed: number) => {
  if (!userId) return;
  const history = getHistoryItems(userId);
  const newItem: HistoryItem = {
    id: Date.now().toString(),
    date: Date.now(),
    language,
    mode,
    itemCount,
    durationPlayed
  };
  // Keep last 50 entries
  const updated = [newItem, ...history].slice(0, 50);
  localStorage.setItem(`${HISTORY_PREFIX}${userId}`, JSON.stringify(updated));
};

export const getHistoryItems = (userId: string): HistoryItem[] => {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${HISTORY_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const clearHistory = (userId: string) => {
  localStorage.removeItem(`${HISTORY_PREFIX}${userId}`);
};

// --- Drafts (Auto-save) ---

export const saveDraft = (userId: string, language: Language, mode: Mode, text: string) => {
  if (!userId || !text) return; 
  const key = `${DRAFT_PREFIX}${userId}_${language}_${mode}`;
  localStorage.setItem(key, text);
};

export const getDraft = (userId: string, language: Language, mode: Mode): string => {
  if (!userId) return '';
  const key = `${DRAFT_PREFIX}${userId}_${language}_${mode}`;
  return localStorage.getItem(key) || '';
};

export const clearDraft = (userId: string, language: Language, mode: Mode) => {
  const key = `${DRAFT_PREFIX}${userId}_${language}_${mode}`;
  localStorage.removeItem(key);
};
