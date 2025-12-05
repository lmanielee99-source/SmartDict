import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  colorTheme?: 'blue' | 'pink' | 'green';
  onBack?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, colorTheme = 'blue', onBack }) => {
  const getThemeClass = () => {
    switch (colorTheme) {
      case 'pink': return 'border-accent-pink';
      case 'green': return 'border-accent-green';
      default: return 'border-accent-blue';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className={`
        relative w-full max-w-4xl min-h-[85vh] 
        bg-paper bg-book-pattern 
        rounded-r-3xl rounded-l-md 
        book-shadow 
        flex flex-col
        border-l-[12px] border-wood
        overflow-hidden
      `}>
        {/* Book Spine Detail */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/20 to-transparent pointer-events-none"></div>

        {/* Header / Top Page Margin */}
        <div className={`w-full p-6 border-b-2 border-dashed ${getThemeClass()} flex justify-between items-center`}>
          <div className="flex items-center gap-4">
             {onBack && (
               <button 
                 onClick={onBack}
                 className="flex items-center gap-1 text-ink opacity-60 hover:opacity-100 transition-opacity font-bold"
               >
                 <ChevronLeft size={24} />
                 <span className="hidden md:inline">Back</span>
               </button>
             )}
             <h1 className="text-2xl md:text-3xl font-serif text-ink font-bold tracking-wide">
                SmartDict <span className="text-sm font-sans font-normal opacity-60 ml-2">智能默書機</span>
             </h1>
          </div>
          
          {title && <div className="text-lg font-fun text-ink bg-white/50 px-4 py-1 rounded-full hidden md:block">{title}</div>}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto font-sans text-ink">
          {children}
        </div>

        {/* Footer / Page Number */}
        <div className="p-4 flex justify-center opacity-40 font-serif italic text-sm">
           ~ Happy Learning ~
        </div>
      </div>
    </div>
  );
};