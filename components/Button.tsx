import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', icon, className, ...props }) => {
  const baseStyle = "transform transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold font-fun shadow-md border-b-4";
  
  const variants = {
    primary: "bg-accent-blue text-white border-blue-400 hover:brightness-110",
    secondary: "bg-white text-ink border-gray-200 hover:bg-gray-50",
    danger: "bg-accent-pink text-white border-red-300 hover:brightness-110",
    success: "bg-accent-green text-green-900 border-green-400 hover:brightness-110"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className || ''} disabled:opacity-50 disabled:cursor-not-allowed`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};
