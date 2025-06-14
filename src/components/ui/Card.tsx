import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'outlined' | 'highlight';
  showWatermark?: boolean;
}

export default function Card({ children, className = '', variant = 'default', showWatermark = false }: CardProps) {
  // Base styles that apply to all variants
  let baseStyles = 'rounded-xl overflow-hidden relative';
  
  // Apply variant-specific styles
  let variantStyles = '';
  switch (variant) {
    case 'gradient':
      variantStyles = 'bg-gradient-to-br from-[var(--card-bg)] to-[var(--darker-card)] border border-[var(--card-border)]';
      break;
    case 'outlined':
      variantStyles = 'bg-transparent border-2 border-[var(--card-border)] p-4';
      break;
    case 'highlight':
      variantStyles = 'border border-[var(--primary)] border-opacity-30 shadow-lg shadow-[var(--primary-shadow)]';
      break;
    default: // 'default'
      variantStyles = 'bg-[var(--card-bg)] border border-[var(--card-border)] p-4 shadow-sm';
  }
  
  return (
    <div className={`${baseStyles} ${variantStyles} ${className}`}>
      {children}
      
      {/* Afrimetrics watermark */}
      {showWatermark && (
        <div className="brand-watermark absolute bottom-2 right-2 opacity-5 pointer-events-none">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor" />
          </svg>
        </div>
      )}
    </div>
  );
}