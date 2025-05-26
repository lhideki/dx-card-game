
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center my-10 p-5">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"
           role="status" aria-label="読み込み中"></div>
      <p className="mt-5 text-slate-300 text-lg font-medium tracking-wide"> 
        データ解析中...
      </p>
    </div>
  );
};

export default LoadingSpinner;