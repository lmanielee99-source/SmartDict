import React, { useState, useRef, useEffect } from 'react';
import { Camera, Edit3, ArrowRight, Bookmark, Check } from 'lucide-react';
import { Language, Mode, DictationItem } from '../types';
import { extractTextFromImage, processTextForDictation } from '../services/geminiService';
import { saveDraft, getDraft, saveDictationToLibrary, clearDraft } from '../services/storageService';
import { Button } from './Button';

interface DictationSetupProps {
  userId: string;
  language: Language;
  mode: Mode;
  initialItems?: DictationItem[]; // If loaded from library
  initialTitle?: string;
  onStart: (items: DictationItem[]) => void;
  onBack: () => void;
}

export const DictationSetup: React.FC<DictationSetupProps> = ({ 
  userId, language, mode, initialItems, initialTitle, onStart, onBack 
}) => {
  const isChinese = language === Language.CHINESE;
  
  const [inputText, setInputText] = useState('');
  const [title, setTitle] = useState(initialTitle || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // If initialItems exist (from library), go straight to preview, else input
  const [step, setStep] = useState<'input' | 'preview'>(initialItems ? 'preview' : 'input');
  const [processedItems, setProcessedItems] = useState<DictationItem[]>(initialItems || []);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-load draft if not loading a preset
  useEffect(() => {
    if (!initialItems && step === 'input' && userId) {
      const draft = getDraft(userId, language, mode);
      if (draft) setInputText(draft);
    }
  }, [userId, language, mode, initialItems, step]);

  // Auto-save draft
  useEffect(() => {
    if (step === 'input' && userId) {
      const timer = setTimeout(() => {
        saveDraft(userId, language, mode, inputText);
      }, 1000);
      return () => clearTimeout(timer);
    }
    // Reset saved state if input changes
    setIsSaved(false);
  }, [inputText, language, mode, step, userId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const extracted = await extractTextFromImage(file, language);
      setInputText(prev => prev + (prev ? '\n' : '') + extracted);
    } catch (error) {
      alert(isChinese ? "無法讀取圖片，請重試。" : "Failed to read image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    try {
      const chunks = await processTextForDictation(inputText, mode, language);
      let items: DictationItem[] = chunks.map((c, i) => ({
        id: `item-${i}`,
        text: c.display,
        spokenText: c.spoken
      }));

      // Unique Filter for Vocabulary Mode
      if (mode === Mode.VOCABULARY) {
          const seen = new Set();
          items = items.filter(item => {
              const key = item.text.trim();
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
          });
      }

      setProcessedItems(items);
      setStep('preview');
      setIsSaved(false); // Reset saved state for new content
    } catch (e) {
      alert(isChinese ? "處理內容時發生錯誤。" : "Error processing text.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToLibrary = () => {
    if (!title.trim()) {
      alert(isChinese ? "請輸入默書標題 / 主題" : "Please enter a title/topic.");
      return;
    }
    
    saveDictationToLibrary(userId, title, language, mode, processedItems);
    setIsSaved(true);
    // Also clear draft since we saved it for real
    clearDraft(userId, language, mode);
  };

  if (step === 'preview') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-serif text-ink">
              {isChinese ? '準備開始？' : 'Ready to Start?'}
          </h2>
        </div>
        
        {/* Title / Topic Input Section */}
        <div className="bg-white/40 p-4 rounded-xl border border-wood/10">
            <label className="block text-xs font-bold uppercase opacity-50 mb-1">
                {isChinese ? '默書標題 / 主題 (儲存用)' : 'Topic / Title (For Saving)'}
            </label>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={isChinese ? "例如：第一課 生字" : "e.g. Chapter 1 Vocab"}
                    disabled={isSaved}
                    className="flex-1 bg-transparent text-lg font-bold text-wood border-b-2 border-wood/30 focus:border-accent-blue focus:outline-none py-1 placeholder:font-normal placeholder:opacity-40 disabled:opacity-50"
                />
                <button 
                    onClick={handleSaveToLibrary}
                    disabled={isSaved}
                    className={`
                        px-4 py-1 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors border 
                        ${isSaved 
                            ? 'bg-green-100 text-green-700 border-green-200 cursor-default' 
                            : 'bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue border-accent-blue/20'
                        }
                    `}
                >
                    {isSaved ? <Check size={16} /> : <Bookmark size={16} />}
                    {isSaved ? (isChinese ? '已儲存' : 'Saved') : (isChinese ? '儲存內容' : 'Save Content')}
                </button>
            </div>
        </div>
        
        <div className="bg-white/60 p-4 rounded-xl border border-gray-200 max-h-60 overflow-y-auto">
          <h3 className="font-bold mb-2 text-sm uppercase tracking-wider opacity-50">
              {isChinese ? '內容預覽' : 'Content Preview'}
          </h3>
          <ul className="space-y-2">
            {processedItems.map((item, idx) => (
              <li key={item.id} className="text-lg border-b border-gray-100 pb-1 flex gap-2">
                <span className="opacity-40 select-none">{idx + 1}.</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-4 pt-4">
           <Button variant="secondary" onClick={() => setStep('input')} className="flex-1">
               {isChinese ? '修改' : 'Edit'}
           </Button>
           <Button variant="success" onClick={() => onStart(processedItems)} className="flex-1" icon={<ArrowRight size={20}/>}>
             {isChinese ? '開始默書' : 'Start Dictation'}
           </Button>
        </div>
      </div>
    );
  }

  // Input Step
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-serif text-ink mb-1">
          {isChinese ? '準備內容' : 'Prepare Content'}
        </h2>
        <p className="text-sm opacity-60">
            {isChinese ? '自動儲存中... 可輸入或拍攝照片' : 'Auto-saving... Type, Paste, or Snap a photo'}
        </p>
      </div>

      <div className="flex gap-2 justify-center">
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()} icon={<Camera size={20} />}>
          {isChinese ? '文字識別 / 拍攝' : 'OCR / Camera'}
        </Button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          capture="environment"
          onChange={handleFileUpload}
        />
      </div>

      <div className="relative">
        <textarea
          className="w-full h-48 p-4 rounded-xl border-2 border-gray-200 bg-white/50 focus:border-accent-blue focus:ring-0 text-lg transition-all resize-none"
          placeholder={isChinese ? "在此輸入文字..." : "Enter text here..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
            <div className="animate-bounce text-xl font-fun text-accent-blue">
                {isChinese ? '處理中...' : 'Processing...'}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Button variant="secondary" onClick={onBack} className="w-1/3">
            {isChinese ? '返回' : 'Back'}
        </Button>
        <Button 
          variant="primary" 
          onClick={handleProcess} 
          disabled={!inputText.trim() || isLoading} 
          className="flex-1"
          icon={<Edit3 size={18} />}
        >
          {isChinese ? '處理內容' : 'Process Content'}
        </Button>
      </div>
    </div>
  );
};
