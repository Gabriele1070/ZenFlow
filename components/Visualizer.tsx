import React from 'react';

interface VisualizerProps {
  isActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ isActive }) => {
  return (
    <div className="relative w-64 h-64 mx-auto flex items-center justify-center my-8">
      {/* Outer Glow */}
      <div className={`absolute inset-0 rounded-full bg-zen-500 blur-3xl transition-opacity duration-1000 ${isActive ? 'opacity-40 animate-pulse' : 'opacity-10'}`}></div>
      
      {/* Breathing Rings */}
      <div className={`absolute w-full h-full border-2 border-zen-400/30 rounded-full ${isActive ? 'animate-breathe' : ''}`}></div>
      <div className={`absolute w-48 h-48 border border-zen-300/40 rounded-full ${isActive ? 'animate-breathe' : ''}`} style={{ animationDelay: '1s' }}></div>
      <div className={`absolute w-32 h-32 border border-zen-200/50 rounded-full ${isActive ? 'animate-breathe' : ''}`} style={{ animationDelay: '2s' }}></div>
      
      {/* Center Core */}
      <div className="relative w-24 h-24 bg-gradient-to-br from-zen-400 to-zen-600 rounded-full shadow-2xl flex items-center justify-center z-10">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
      </div>
    </div>
  );
};

export default Visualizer;