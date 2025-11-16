
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 transition-all duration-300 border border-gray-200/80 hover:shadow-md ${className}`}>
      {children}
    </div>
  );
};

export default Card;