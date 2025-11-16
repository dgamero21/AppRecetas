import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  position?: 'top' | 'bottom';
}

const Tooltip: React.FC<TooltipProps> = ({ children, text, position = 'top' }) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  };

  return (
    <div className="relative group inline-flex">
      {children}
      <div
        role="tooltip"
        className={`absolute ${positionClasses[position]} w-max max-w-xs scale-0 group-hover:scale-100 transition-all origin-bottom duration-200
                   bg-gray-800 text-white text-xs font-semibold rounded-md shadow-lg px-2 py-1 pointer-events-none z-50 whitespace-nowrap`}
      >
        {text}
      </div>
    </div>
  );
};

export default Tooltip;