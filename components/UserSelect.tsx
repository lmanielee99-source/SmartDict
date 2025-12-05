import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { createUser, deleteUser } from '../services/storageService';
import { Plus, User, Trash2, Camera, Check } from 'lucide-react';
import { Button } from './Button';

interface UserSelectProps {
  users: UserProfile[];
  onSelect: (user: UserProfile) => void;
  onUpdate: () => void; // Trigger refresh of user list
}

const AVATAR_PRESETS = [
  { char: '🐻', color: 'bg-amber-100' },
  { char: '🐰', color: 'bg-pink-100' },
  { char: '🐱', color: 'bg-orange-100' },
  { char: '🐶', color: 'bg-blue-100' },
];

export const UserSelect: React.FC<UserSelectProps> = ({ users, onSelect, onUpdate }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [customImage, setCustomImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    
    let avatar = AVATAR_PRESETS[selectedPresetIndex].char;
    let isCustom = false;

    if (customImage) {
      avatar = customImage;
      isCustom = true;
    }

    const newUser = createUser(newName.trim(), avatar, isCustom);
    onSelect(newUser);
    onUpdate(); // Though onSelect usually changes view
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this user and all their data?')) {
      deleteUser(id);
      onUpdate();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isCreating || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in">
         <div className="bg-white/90 p-8 rounded-3xl shadow-xl max-w-md w-full border-4 border-wood relative">
             <h2 className="text-3xl font-serif text-center mb-8 text-ink font-bold">
               {users.length === 0 ? "Welcome!" : "New User"}
             </h2>

             {/* Avatar Selection */}
             <div className="mb-8">
                 <label className="block text-sm font-bold text-center mb-4 uppercase opacity-50">Choose Avatar</label>
                 <div className="flex justify-center gap-4 mb-4">
                     {AVATAR_PRESETS.map((p, idx) => (
                         <button
                            key={idx}
                            onClick={() => { setSelectedPresetIndex(idx); setCustomImage(null); }}
                            className={`w-14 h-14 rounded-full text-2xl flex items-center justify-center transition-all border-4 ${selectedPresetIndex === idx && !customImage ? 'border-accent-blue scale-110 shadow-md' : 'border-transparent hover:scale-105'} ${p.color}`}
                         >
                             {p.char}
                         </button>
                     ))}
                 </div>
                 
                 <div className="text-center">
                    <p className="text-xs opacity-40 mb-2">- OR -</p>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={`mx-auto px-4 py-2 rounded-xl border-2 flex items-center gap-2 text-sm font-bold transition-all ${customImage ? 'border-accent-blue text-accent-blue bg-blue-50' : 'border-dashed border-gray-300 text-gray-400 hover:border-gray-400'}`}
                    >
                        {customImage ? <><Check size={16}/> Photo Selected</> : <><Camera size={16}/> Upload Photo</>}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                 </div>
             </div>

             {/* Name Input */}
             <div className="mb-8">
                 <label className="block text-sm font-bold text-center mb-2 uppercase opacity-50">Name</label>
                 <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full text-center text-2xl font-bold py-2 border-b-2 border-wood/30 focus:border-accent-blue outline-none bg-transparent"
                    placeholder="Enter Name"
                    autoFocus
                 />
             </div>

             <div className="flex gap-4">
                {users.length > 0 && (
                    <Button variant="secondary" onClick={() => setIsCreating(false)} className="flex-1">Cancel</Button>
                )}
                <Button 
                    variant="success" 
                    onClick={handleCreate} 
                    disabled={!newName.trim()} 
                    className="flex-1"
                >
                    Start
                </Button>
             </div>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white drop-shadow-md mb-12 text-center">
            Who is learning?
        </h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl">
            {users.map(user => (
                <div key={user.id} className="group relative">
                    <button 
                        onClick={() => onSelect(user)}
                        className="flex flex-col items-center gap-4 transition-transform hover:scale-105 active:scale-95"
                    >
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative">
                            {user.isCustom ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-5xl md:text-6xl select-none">{user.avatar}</span>
                            )}
                        </div>
                        <span className="text-xl font-bold text-white bg-black/20 px-4 py-1 rounded-full backdrop-blur-sm">
                            {user.name}
                        </span>
                    </button>
                    <button 
                        onClick={(e) => handleDelete(e, user.id)}
                        className="absolute top-0 right-0 p-2 bg-red-100 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                        title="Delete User"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}

            {/* Add Button */}
            <button 
                onClick={() => setIsCreating(true)}
                className="flex flex-col items-center gap-4 transition-transform hover:scale-105 active:scale-95 opacity-80 hover:opacity-100"
            >
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-black/20 border-4 border-dashed border-white/40 flex items-center justify-center text-white">
                    <Plus size={40} />
                </div>
                <span className="text-xl font-bold text-white/60">Add User</span>
            </button>
        </div>
    </div>
  );
};
