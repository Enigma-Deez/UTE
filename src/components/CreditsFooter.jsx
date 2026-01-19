import React from 'react';

const CreditsFooter = () => {
  return (
    <div className="absolute bottom-2 right-4 z-0 opacity-40 hover:opacity-100 transition-opacity duration-300">
      <div className="text-[10px] text-gray-500 flex flex-col items-end text-right leading-tight">
        <span>Sound Effects by <a href="https://pixabay.com/users/freesound_community-46691455/" target="_blank" rel="noopener noreferrer" className="hover:text-white underline decoration-gray-700">freesound_community</a></span>
        <span>from <a href="https://pixabay.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white underline decoration-gray-700">Pixabay</a></span>
      </div>
    </div>
  );
};

export default CreditsFooter;