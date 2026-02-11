import React from 'react';
import { Shield } from 'lucide-react';

const ShieldSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { container: 'w-12 h-12', ring: 'w-12 h-12 border-2', icon: 16 },
    md: { container: 'w-20 h-20', ring: 'w-20 h-20 border-3', icon: 28 },
    lg: { container: 'w-28 h-28', ring: 'w-28 h-28 border-4', icon: 40 },
    xl: { container: 'w-36 h-36', ring: 'w-36 h-36 border-4', icon: 52 }
  };
  
  return (
    <div className={`relative ${sizes[size].container} ${className}`}>
      {/* Outer spinning ring */}
      <div 
        className={`absolute inset-0 ${sizes[size].ring} border-slate-200 border-t-blue-600 border-r-blue-600 rounded-full animate-spin`}
      />
      {/* Inner glow effect */}
      <div className="absolute inset-2 bg-gradient-to-br from-blue-50 to-slate-50 rounded-full" />
      {/* Shield icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Shield 
          size={sizes[size].icon} 
          className="text-blue-600 drop-shadow-sm animate-pulse" 
          strokeWidth={1.5}
        />
      </div>
    </div>
  );
};

export default ShieldSpinner;
