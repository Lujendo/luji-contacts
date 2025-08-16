import React from 'react';
import { Users, Mail, Shield, Zap, Globe, Star, Database, Cloud, Lock } from 'lucide-react';

const FloatingElements: React.FC = () => {
  const elements = [
    { Icon: Users, position: 'top-20 left-20', delay: '0s', size: 'w-8 h-8' },
    { Icon: Mail, position: 'top-40 right-32', delay: '1s', size: 'w-6 h-6' },
    { Icon: Shield, position: 'bottom-32 left-16', delay: '2s', size: 'w-10 h-10' },
    { Icon: Zap, position: 'top-60 left-1/2', delay: '0.5s', size: 'w-7 h-7' },
    { Icon: Globe, position: 'bottom-40 right-20', delay: '1.5s', size: 'w-9 h-9' },
    { Icon: Star, position: 'top-32 left-1/3', delay: '2.5s', size: 'w-5 h-5' },
    { Icon: Database, position: 'bottom-60 left-1/4', delay: '3s', size: 'w-8 h-8' },
    { Icon: Cloud, position: 'top-80 right-1/4', delay: '0.8s', size: 'w-6 h-6' },
    { Icon: Lock, position: 'bottom-20 right-1/3', delay: '2.2s', size: 'w-7 h-7' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {elements.map((element, index) => {
        const { Icon, position, delay, size } = element;
        return (
          <div
            key={index}
            className={`absolute ${position} opacity-20 animate-float`}
            style={{ animationDelay: delay }}
          >
            <div className={`${size} text-blue-300 animate-pulse`}>
              <Icon className="w-full h-full" />
            </div>
          </div>
        );
      })}
      
      {/* Additional geometric shapes */}
      <div className="absolute top-1/4 right-1/4 w-4 h-4 border-2 border-indigo-300/30 rotate-45 animate-spin opacity-40" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-1/3 left-1/5 w-6 h-6 border border-blue-400/20 rounded-full animate-ping opacity-30" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 right-1/5 w-3 h-3 bg-slate-400/20 transform rotate-45 animate-bounce opacity-50" style={{ animationDelay: '2s' }}></div>
      
      {/* Gradient orbs */}
      <div className="absolute top-1/6 left-1/6 w-32 h-32 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-full blur-xl animate-pulse opacity-60"></div>
      <div className="absolute bottom-1/6 right-1/6 w-40 h-40 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-xl animate-pulse opacity-40" style={{ animationDelay: '3s' }}></div>
    </div>
  );
};

export default FloatingElements;
