import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Button } from './components/Button';
import { DictationSetup } from './components/DictationSetup';
import { DictationRunner } from './components/DictationRunner';
import { UserSelect } from './components/UserSelect';
import { AppState, Language, Mode, DictationItem, SavedDictation, UserProfile } from './types';
import { getSavedDictations, deleteSavedDictation, getHistoryItems, clearHistory, getUsers } from './services/storageService';
import { BookOpen, Languages, Sparkles, ThumbsUp, Trophy, Zap, Heart, Lightbulb, Library, Trash2, ArrowRight, Calendar, FileText, UserCircle, LogOut } from 'lucide-react';

const PRAISE_STICKERS = [
  { text: "Good Job!", sub: "You are amazing!", Icon: ThumbsUp, color: "text-blue-500", bg: "bg-blue-100" },
  { text: "Excellent!", sub: "Keep it up!", Icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-100" },
  { text: "加油!", sub: "繼續努力!", Icon: Zap, color: "text-red-500", bg: "bg-red-100" },
  { text: "Wonderful!", sub: "So proud of you!", Icon: Heart, color: "text-pink-500", bg: "bg-pink-100" },
  { text: "Smart!", sub: "Well done!", Icon: Lightbulb, color: "text-green-500", bg: "bg-green-100" }
];

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.USER_SELECT);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);

  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [mode, setMode] = useState<Mode>(Mode.VOCABULARY);
  const [dictationItems, setDictationItems] = useState<DictationItem[]>([]);
  
  // For Library / History Feature
  const [presetTitle, setPresetTitle] = useState<string>('');

  // Initial Load of Users
  useEffect(() => {
    setUsers(getUsers());
  }, []);

  const refreshUsers = () => {
    setUsers(getUsers());
  };

  const handleUserSelect = (user: UserProfile) => {
    setCurrentUser(user);
    setAppState(AppState.MENU);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAppState(AppState.USER_SELECT);
  };

  const praise = useMemo(() => {
    return PRAISE_STICKERS[Math.floor(Math.random() * PRAISE_STICKERS.length)];
  }, [appState === AppState.FINISHED]);

  // --- Navigation Helpers ---
  const selectMode = (lang: Language, m: Mode) => {
    setLanguage(lang);
    setMode(m);
    setPresetTitle('');
    setDictationItems([]); 
    setAppState(AppState.SETUP);
  };

  const loadPreset = (preset: SavedDictation) => {
    setLanguage(preset.language);
    setMode(preset.mode);
    setDictationItems(preset.items);
    setPresetTitle(preset.title);
    setAppState(AppState.SETUP);
  };
  
  const openWorksheet = (preset: SavedDictation) => {
    setLanguage(preset.language);
    setMode(preset.mode);
    setDictationItems(preset.items);
    setPresetTitle(preset.title);
    setAppState(AppState.WORKSHEET);
  }

  const startDictation = (items: DictationItem[]) => {
    setDictationItems(items);
    setAppState(AppState.DICTATION);
  };

  const finishDictation = () => {
    setAppState(AppState.FINISHED);
  };

  const resetApp = () => {
    setAppState(AppState.MENU);
    setDictationItems([]);
  };

  // --- Renders ---

  if (appState === AppState.USER_SELECT) {
    return <UserSelect users={users} onSelect={handleUserSelect} onUpdate={refreshUsers} />;
  }

  if (appState === AppState.MENU) {
    return (
      <Layout colorTheme="blue">
        <div className="flex flex-col gap-6 items-center justify-center h-full relative">
          
          {/* User Profile Header in Menu */}
          <div className="absolute top-0 right-0 p-2 flex items-center gap-2">
             <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full border border-wood/10">
                 <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-lg border border-wood/20">
                     {currentUser?.isCustom ? <img src={currentUser.avatar} className="w-full h-full object-cover"/> : currentUser?.avatar}
                 </div>
                 <span className="font-bold text-wood text-sm">{currentUser?.name}</span>
             </div>
             <button onClick={handleLogout} className="text-xs text-wood/50 hover:text-wood hover:underline">
                 Switch
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mt-8">
            {/* English Section */}
            <div className="bg-white/60 p-6 rounded-2xl border-2 border-accent-blue/30 hover:border-accent-blue transition-all group">
              <div className="flex items-center gap-3 mb-4 text-accent-blue">
                <Languages size={28} />
                <h3 className="text-xl font-bold font-fun">English Dictation</h3>
              </div>
              <div className="space-y-3">
                <Button className="w-full justify-between" onClick={() => selectMode(Language.ENGLISH, Mode.VOCABULARY)}>
                   Vocabulary <span className="text-xs bg-white/40 px-2 py-1 rounded">Words</span>
                </Button>
                <Button className="w-full justify-between" variant="secondary" onClick={() => selectMode(Language.ENGLISH, Mode.PASSAGE)}>
                   Passage <span className="text-xs bg-gray-100 px-2 py-1 rounded">Text</span>
                </Button>
              </div>
            </div>

            {/* Chinese Section */}
            <div className="bg-white/60 p-6 rounded-2xl border-2 border-accent-pink/30 hover:border-accent-pink transition-all group">
              <div className="flex items-center gap-3 mb-4 text-accent-pink">
                <BookOpen size={28} />
                <h3 className="text-xl font-bold font-fun">中文默書</h3>
              </div>
              <div className="space-y-3">
                <Button className="w-full justify-between" variant="danger" onClick={() => selectMode(Language.CHINESE, Mode.VOCABULARY)}>
                   中文單字 <span className="text-xs bg-white/40 px-2 py-1 rounded">詞語</span>
                </Button>
                <Button className="w-full justify-between" variant="secondary" onClick={() => selectMode(Language.CHINESE, Mode.PASSAGE)}>
                   中文篇章 <span className="text-xs bg-gray-100 px-2 py-1 rounded">段落</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Library Button Only */}
          <div className="w-full max-w-2xl mt-2">
            <Button 
              variant="success" 
              className="w-full py-4 bg-wood border-wood text-white hover:brightness-110"
              icon={<Library />}
              onClick={() => setAppState(AppState.LIBRARY)}
            >
              默書庫 Library
            </Button>
          </div>

        </div>
      </Layout>
    );
  }

  if (appState === AppState.LIBRARY) {
    // Load presets for current user
    const saved = getSavedDictations(currentUser?.id || '');
    
    return (
      <Layout 
        title="My Library" 
        colorTheme="green" 
        onBack={() => setAppState(AppState.MENU)}
      >
         <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-serif text-ink">我的默書庫</h2>
            </div>

            {saved.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-50 space-y-4">
                 <Library size={64} />
                 <p>暫時未有儲存的默書 (No saved dictations)</p>
                 <p className="text-sm">在設定頁面按 "Save" 即可加入</p>
              </div>
            ) : (
              <div className="grid gap-4 overflow-y-auto pb-4">
                 {saved.map(item => (
                   <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between shadow-sm hover:shadow-md transition-shadow gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-ink">{item.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${item.language === Language.CHINESE ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            {item.language === Language.CHINESE ? '中' : 'Eng'}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {item.mode === Mode.VOCABULARY ? 'Words' : 'Passage'}
                          </span>
                        </div>
                        <p className="text-sm opacity-60">
                           {new Date(item.createdAt).toLocaleDateString()} • {item.items.length} items
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 justify-end">
                         <button 
                             onClick={() => openWorksheet(item)}
                             className="px-3 py-2 text-xs font-bold bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 flex items-center gap-1"
                             title="Fill-in-the-blanks Worksheet"
                         >
                             <FileText size={16} /> 方格 Worksheet
                         </button>
                         <button 
                           onClick={() => {
                             if(confirm('Delete this dictation?')) {
                               deleteSavedDictation(currentUser?.id || '', item.id);
                               setAppState(AppState.MENU);
                               setTimeout(() => setAppState(AppState.LIBRARY), 0);
                             }
                           }}
                           className="p-2 text-red-400 hover:bg-red-50 rounded-full"
                         >
                           <Trash2 size={20} />
                         </button>
                         <Button variant="primary" onClick={() => loadPreset(item)} className="px-4 py-2 text-sm">
                            Load <ArrowRight size={16} />
                         </Button>
                      </div>
                   </div>
                 ))}
              </div>
            )}
         </div>
      </Layout>
    );
  }

  // --- WORKSHEET VIEW (Fill-in-the-blanks) ---
  if (appState === AppState.WORKSHEET) {
    return (
        <Layout 
            title="Worksheet" 
            colorTheme="pink"
            onBack={() => setAppState(AppState.LIBRARY)}
        >
             <div className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <div>
                        <h2 className="text-2xl font-serif text-ink">{presetTitle}</h2>
                        <p className="text-xs opacity-50">填寫方格練習 Fill-in-the-blanks</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => window.print()} className="px-4">
                            Print
                        </Button>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 overflow-y-auto flex-1 font-serif leading-loose">
                    {/* Worksheet Header (Visible in Print) */}
                    <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
                        <div className="flex items-center gap-4">
                            {/* Avatar on Worksheet */}
                            <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center bg-gray-50 text-2xl overflow-hidden print:grayscale">
                                {currentUser?.isCustom ? <img src={currentUser.avatar} className="w-full h-full object-cover"/> : currentUser?.avatar}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">{presetTitle}</h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Name: <span className="font-bold text-black underline decoration-dotted">{currentUser?.name}</span> &nbsp;&nbsp; 
                                    {language === Language.CHINESE ? '日期 Date:' : 'Date:'} _______________
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="w-24 h-24 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-300 font-bold text-xl">
                                 Score
                             </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-8">
                        {dictationItems.map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-baseline">
                                <span className="font-bold text-gray-400 w-8">{idx + 1}.</span>
                                <div className="flex-1 border-b-2 border-gray-300 border-dashed min-h-[3rem] relative">
                                    <div className="absolute top-0 right-0 text-[10px] text-gray-300 select-none print:hidden">
                                        (Answer: {item.text})
                                    </div>
                                </div>
                                <div className="w-12 h-10 border border-gray-400 rounded"></div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-12 text-center text-sm text-gray-400 italic">
                        Created with SmartDict 智能默書機
                    </div>
                </div>
             </div>
        </Layout>
    )
  }

  if (appState === AppState.SETUP) {
    return (
      <Layout 
        colorTheme={language === Language.ENGLISH ? 'blue' : 'pink'}
        onBack={() => setAppState(AppState.MENU)}
      >
        <DictationSetup 
          userId={currentUser?.id || ''}
          language={language} 
          mode={mode} 
          initialItems={dictationItems.length > 0 ? dictationItems : undefined}
          initialTitle={presetTitle}
          onStart={startDictation} 
          onBack={() => setAppState(AppState.MENU)} 
        />
      </Layout>
    );
  }

  if (appState === AppState.DICTATION) {
    return (
      <Layout 
        title={language === Language.CHINESE ? "默書進行中" : "In Progress"} 
        colorTheme="green"
        onBack={() => {
            if(confirm(language === Language.CHINESE ? "確定要結束默書嗎？" : "Are you sure you want to end?")) {
                finishDictation();
            }
        }}
      >
        <DictationRunner 
          userId={currentUser?.id || ''}
          items={dictationItems} 
          language={language} 
          mode={mode} 
          onFinish={finishDictation}
        />
      </Layout>
    );
  }

  if (appState === AppState.FINISHED) {
    const StickerIcon = praise.Icon;
    return (
      <Layout 
        title={language === Language.CHINESE ? "默書完成" : "Good Job!"} 
        colorTheme="pink"
        onBack={resetApp}
      >
        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
          
          <div className={`relative p-8 rounded-full ${praise.bg} mb-4 animate-bounce`}>
            <StickerIcon className={`w-20 h-20 ${praise.color}`} />
            <Sparkles className="absolute -top-2 -right-2 text-yellow-400 w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className={`text-5xl font-fun font-bold ${praise.color} drop-shadow-sm`}>
              {praise.text}
            </h2>
            <p className="text-xl font-serif text-ink opacity-70">
              {praise.sub}
            </p>
          </div>
          
          <div className="pt-8 w-full max-w-xs">
            <Button variant="primary" onClick={resetApp} className="w-full">
              {language === Language.CHINESE ? "返回主目錄" : "Back to Menu"}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
};

export default App;
