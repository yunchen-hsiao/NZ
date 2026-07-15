import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass';
  children: React.ReactNode;
}

export function Card({ 
  variant = 'default', 
  className = '', 
  children, 
  ...props 
}: CardProps) {
  const baseClass = variant === 'glass' ? 'card-glass' : 'card';
  
  return (
    <div 
      className={`${baseClass} ${className}`.trim()} 
      {...props}
    >
      {children}
    </div>
  );
}
