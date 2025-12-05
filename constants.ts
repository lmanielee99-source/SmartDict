import { Language } from "./types";

// Using a high-quality Relaxing Piano track.
// The app logic (DictationRunner) cuts this off after 5 seconds to simulate the "first 5 seconds" rule.
export const START_SOUND_URL = "https://cdn.pixabay.com/audio/2022/03/10/audio_5103362140.mp3"; 
export const END_SOUND_URL = "https://cdn.pixabay.com/audio/2022/03/10/audio_5103362140.mp3"; 

export const LANGUAGE_CONFIG = {
  [Language.CHINESE]: {
    label: '中文默書',
    voiceLang: 'zh-HK',
    startPhrase: '默書開始',
    endPhrase: '默書結束',
    vocabPause: 5000,
    vocabRepeats: 3,
    vocabRepeatInterval: 4000,
  },
  [Language.ENGLISH]: {
    label: 'English Dictation',
    voiceLang: 'en-GB',
    startPhrase: 'Dictation is about to begin',
    endPhrase: 'End of Dictation',
    vocabPause: 5000,
    vocabRepeats: 3,
    vocabRepeatInterval: 4000,
  }
};

export const DEFAULT_DURATION_MINS = 10;