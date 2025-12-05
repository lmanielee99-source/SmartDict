import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Volume2, Gauge, Settings2, Music, RefreshCw } from 'lucide-react';
import { DictationItem, Language, Mode } from '../types';
import { LANGUAGE_CONFIG, START_SOUND_URL, END_SOUND_URL } from '../constants';
import { saveHistoryItem } from '../services/storageService';
import { Button } from './Button';

interface DictationRunnerProps {
  userId: string;
  items: DictationItem[];
  language: Language;
  mode: Mode;
  onFinish: () => void;
}

export const DictationRunner: React.FC<DictationRunnerProps> = ({ 
  userId, items, language, mode, onFinish 
}) => {
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = Not started
  const [status, setStatus] = useState<'IDLE' | 'PLAYING' | 'PAUSED' | 'FINISHED'>('IDLE');
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [instruction, setInstruction] = useState("Get Ready...");
  
  // Settings State
  const [volume, setVolume] = useState(1.0);
  const [rate, setRate] = useState(mode === Mode.VOCABULARY ? 0.7 : 0.6);
  const [showSettings, setShowSettings] = useState(false);

  // Stats for history
  const startTimeRef = useRef<number>(Date.now());

  // Refs for access inside async closures
  const settingsRef = useRef({ volume, rate });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synth = window.speechSynthesis;
  
  const config = LANGUAGE_CONFIG[language];
  const isChinese = language === Language.CHINESE;

  // Sync state to ref
  useEffect(() => {
    settingsRef.current = { volume, rate };
    if (audioRef.current) {
        audioRef.current.volume = volume;
    }
  }, [volume, rate]);

  // Clean up on unmount
  useEffect(() => {
      return () => {
          window.speechSynthesis.cancel();
          if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
          }
      };
  }, []);

  // --- Helper Functions ---

  const playSound = (url: string): Promise<void> => {
    return new Promise((resolve) => {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.volume = settingsRef.current.volume;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => resolve()); // Ignore auto-play errors
        resolve();
      } else {
        const audio = new Audio(url);
        audio.volume = settingsRef.current.volume;
        audioRef.current = audio;
        audio.play().catch(() => resolve());
        resolve();
      }
    });
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const speak = (text: string, options?: { rateOverride?: number }): Promise<void> => {
    return new Promise((resolve) => {
      // Cancel previous
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = config.voiceLang;
      // Use override rate if provided (e.g. for Review mode), else user setting
      utterance.rate = options?.rateOverride ?? settingsRef.current.rate; 
      utterance.volume = settingsRef.current.volume; 

      const voices = synth.getVoices();
      let preferredVoice: SpeechSynthesisVoice | undefined;

      if (config.voiceLang === 'zh-HK') {
          // STRICT CANTONESE SELECTION
          const cantoneseVoices = voices.filter(v => 
             v.lang === 'zh-HK' || 
             v.lang === 'zh_HK' || 
             v.lang === 'yue-HK' || 
             v.lang === 'yue_HK' ||
             v.lang === 'yue'
          );
          
          preferredVoice = cantoneseVoices.find(v => 
            v.name.includes('Sin-ji') ||      
            v.name.includes('HiuGaai') ||     
            v.name.includes('Hong Kong') ||   
            (v.name.includes('Google') && v.name.includes('Cantonese')) 
          );
          
          if (!preferredVoice) preferredVoice = cantoneseVoices[0];
          
      } else if (config.voiceLang === 'en-GB') {
          // STRICT OXFORD/BRITISH SELECTION
          const britishVoices = voices.filter(v => v.lang === 'en-GB' || v.lang === 'en_GB');
          
          preferredVoice = britishVoices.find(v => 
            v.name.includes('Google UK') || 
            v.name.includes('Daniel') ||
            v.name.includes('Martha') ||
            v.name.includes('Arthur')
          );

           if (!preferredVoice) preferredVoice = britishVoices[0];
      }

      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      
      synth.speak(utterance);
    });
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // --- Core Loop ---

  const runSequence = useCallback(async () => {
    if (status !== 'PLAYING') return;

    // --- PHASE 1: START ---
    if (currentIndex === -1) {
      setInstruction(config.startPhrase);
      startTimeRef.current = Date.now(); 
      
      // Removed 5s music delay as requested
      // playSound(START_SOUND_URL); 
      // await wait(5000);
      // stopSound(); 
      
      await speak(config.startPhrase);
      await wait(1000);

      setCurrentIndex(0);
      return;
    }

    // --- PHASE 2: CHECK FOR END / TRANSITION ---
    if (currentIndex >= items.length) {
      // 2a. VOCABULARY REVIEW TRANSITION
      if (mode === Mode.VOCABULARY && !isReviewing) {
          const reviewMsg = isChinese ? "現在複習所有單字" : "Reviewing all words now";
          setInstruction(reviewMsg);
          
          await speak(reviewMsg); 
          await wait(2000); 
          
          setIsReviewing(true);
          setCurrentIndex(0); 
          return; 
      }

      // 2b. ACTUAL END
      setStatus('FINISHED');
      setInstruction(config.endPhrase);
      
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      saveHistoryItem(userId, language, mode, items.length, elapsed);

      await speak(config.endPhrase);
      
      playSound(END_SOUND_URL);
      await wait(5000); 
      stopSound(); 
      
      onFinish();
      return;
    }

    // --- PHASE 3: ITEM PROCESSING ---
    const item = items[currentIndex];

    if (isReviewing) {
        // --- 3a. REVIEW MODE LOGIC (Read Once, Slow) ---
        setInstruction(isChinese 
            ? `複習: ${item.text}`
            : `Review: ${item.text}`);
        
        const textToSpeak = item.spokenText || item.text;
        // Strictly force 0.3 speed for review
        await speak(textToSpeak, { rateOverride: 0.3 });
        
        await wait(2000); 
        
        if (status === 'PLAYING') {
            setCurrentIndex(prev => prev + 1);
        }
    } else {
        // --- 3b. NORMAL MODE LOGIC (Read 3 Times) ---
        const repeats = config.vocabRepeats; // 3
        const repeatInterval = config.vocabRepeatInterval; // 4000ms
        const itemPause = config.vocabPause; // 5000ms
        const isVocab = mode === Mode.VOCABULARY;

        if (isVocab) {
            setInstruction(isChinese 
                ? `第 ${currentIndex + 1} 個字: ${item.text}`
                : `Word ${currentIndex + 1}: ${item.text}`); 
        } else {
            setInstruction(isChinese 
                ? `第 ${currentIndex + 1} / ${items.length} 段`
                : `Section ${currentIndex + 1} / ${items.length}`);
        }
        
        // Repeat Loop
        for (let i = 0; i < repeats; i++) {
            if (status !== 'PLAYING') return; 
            
            setCurrentRepeat(i + 1);
            
            const textToSpeak = item.spokenText || item.text;
            await speak(textToSpeak);
            
            if (i < repeats - 1) {
                await wait(repeatInterval);
            }
        }
        
        setCurrentRepeat(0);
        await wait(itemPause); 

        if (status === 'PLAYING') {
            setCurrentIndex(prev => prev + 1);
        }
    }
  }, [currentIndex, items, language, mode, onFinish, status, config, isChinese, isReviewing, userId]);


  // --- Effects ---

  useEffect(() => {
    if (status === 'PLAYING') {
      runSequence();
    }
  }, [currentIndex, status, isReviewing, runSequence]); 

  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

  // --- Handlers ---
  
  const handlePause = () => {
    setStatus('PAUSED');
    synth.pause();
    if (audioRef.current) audioRef.current.pause();
  };

  const handleResume = () => {
    setStatus('PLAYING');
    synth.resume();
  };
  
  const handleStop = () => {
      setStatus('FINISHED');
      synth.cancel();
      stopSound();
      onFinish();
  };

  return (
    <div className="flex flex-col items-center justify-between h-full py-4 relative">
      
      {/* Top Bar: Settings Toggle */}
      <div className="w-full flex justify-end items-start h-10">
        <button 
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-paper-dark text-wood hover:bg-wood hover:text-white transition-colors text-sm font-bold shadow-sm"
        >
            <Settings2 size={18} />
            <span className="hidden md:inline">
                {isChinese ? '速度 音量調節' : 'Speed & Volume'}
            </span>
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
          <div className="w-full bg-white/80 p-4 rounded-xl border border-wood/20 mb-4 animate-fade-in shadow-sm z-20 absolute top-12 left-0 right-0 mx-auto max-w-md">
            <h4 className="font-bold text-sm text-wood mb-3 flex items-center gap-2">
                <Settings2 size={16}/> {isChinese ? '設定' : 'Settings'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase opacity-60">
                        <Volume2 size={14}/> {isChinese ? '音量' : 'Volume'}: {Math.round(volume * 100)}%
                    </label>
                    <input 
                        type="range" min="0" max="1" step="0.1" 
                        value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full accent-accent-blue"
                    />
                </div>
                <div className="space-y-1">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase opacity-60">
                        <Gauge size={14}/> {isChinese ? '速度' : 'Speed'}: {rate}x
                    </label>
                    <input 
                        type="range" min="0.1" max="1.5" step="0.1" 
                        value={rate} onChange={(e) => setRate(parseFloat(e.target.value))}
                        className="w-full accent-accent-pink"
                    />
                </div>
            </div>
          </div>
      )}

      {/* Visual Feedback Area */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-4">
        <div className="w-full max-w-lg bg-white/50 rounded-3xl p-8 min-h-[220px] flex flex-col items-center justify-center text-center shadow-inner border-2 border-dashed border-gray-200 relative overflow-hidden group">
            
            <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent-blue via-accent-pink to-accent-green opacity-50 ${isReviewing ? 'animate-pulse' : ''}`}></div>

            {status === 'PLAYING' && currentIndex === -1 && (
                <div className="animate-pulse text-accent-blue mb-4">
                    <Music size={48} className="animate-bounce" />
                </div>
            )}

            {isReviewing && (
                <div className="absolute top-4 right-4 text-accent-green animate-pulse flex items-center gap-1">
                    <RefreshCw size={20} className="animate-spin-slow"/>
                    <span className="text-xs font-bold uppercase">{isChinese ? '複習中' : 'Reviewing'}</span>
                </div>
            )}

            {currentIndex >= 0 && (
                <Volume2 className={`w-12 h-12 mb-4 text-accent-blue ${status === 'PLAYING' ? 'animate-bounce' : 'opacity-50'}`} />
            )}
            
            <h3 className="text-3xl font-serif text-ink mb-4 leading-relaxed">
            {instruction}
            </h3>

            {currentIndex >= 0 && status === 'PLAYING' && !isReviewing && (
                <div className="flex gap-3 mt-2">
                    {Array.from({ length: config.vocabRepeats }).map((_, i) => {
                    const r = i + 1;
                    return (
                        <div 
                            key={r} 
                            className={`
                                w-4 h-4 rounded-full transition-all duration-300
                                ${currentRepeat >= r ? 'bg-accent-blue scale-110 shadow-sm' : 'bg-gray-200 scale-100'}
                            `} 
                        />
                    );
                    })}
                </div>
            )}
        </div>
      </div>
      
      {/* Playback Controls */}
      <div className="flex gap-4 w-full justify-center">
        {status === 'PLAYING' ? (
          <Button className="w-32" variant="secondary" onClick={handlePause} icon={<Pause />}>
              {isChinese ? '暫停' : 'Pause'}
          </Button>
        ) : (
          <Button className="w-32" variant="primary" onClick={handleResume} disabled={status === 'FINISHED' || currentIndex === -1} icon={<Play />}>
              {isChinese ? '繼續' : 'Resume'}
          </Button>
        )}
        
        {currentIndex === -1 && status === 'IDLE' && (
            <Button className="w-32" variant="success" onClick={() => setStatus('PLAYING')} icon={<Play />}>
                {isChinese ? '開始' : 'Start'}
            </Button>
        )}

        <Button className="w-32" variant="danger" onClick={handleStop} icon={<Square />}>
            {isChinese ? '結束' : 'End'}
        </Button>
      </div>
    </div>
  );
};
