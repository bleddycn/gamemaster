interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

export default function Logo({ className = '', size = 'md', variant = 'dark' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  const colors = variant === 'light' 
    ? 'text-white' 
    : 'text-gray-900';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-600 shadow-lg`}>
        <div className="relative">
          {/* Game controller/trophy hybrid icon */}
          <svg viewBox="0 0 24 24" fill="none" className="w-2/3 h-2/3 text-white">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C10.34 2 9 3.34 9 5v1H7c-1.1 0-2 .9-2 2v1c0 .55-.45 1-1 1s-1-.45-1-1V8c0-2.21 1.79-4 4-4h1V3c0-1.66 1.34-3 3-3s3 1.34 3 3v1h1c2.21 0 4 1.79 4 4v1c0 .55-.45 1-1 1s-1-.45-1-1V8c0-1.1-.9-2-2-2h-2V5c0-1.66-1.34-3-3-3z"
              fill="currentColor"
            />
            <circle cx="8" cy="11" r="1" fill="currentColor" />
            <circle cx="16" cy="11" r="1" fill="currentColor" />
            <path
              d="M12 14l-2 4h4l-2-4z M10 18h4l1 2H9l1-2z"
              fill="currentColor"
            />
          </svg>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-[8px] font-bold text-yellow-900">★</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <span className={`font-black ${textSizeClasses[size]} ${colors} leading-none tracking-tight`}>
          Game<span className="text-indigo-600">Master</span>
        </span>
        {size !== 'sm' && (
          <span className={`text-xs font-medium ${variant === 'light' ? 'text-white/80' : 'text-gray-500'} tracking-wide uppercase`}>
            Sports Competition Platform
          </span>
        )}
      </div>
    </div>
  );
}