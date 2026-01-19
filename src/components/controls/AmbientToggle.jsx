import React from 'react';
import { CloudRain, Trees, VolumeX } from 'lucide-react';
import { audioEngine } from '../../services/AudioEngine';
import clsx from 'clsx';

const sounds = [
  { id: 'none', icon: VolumeX, label: 'Silent' },
  { id: 'rain', icon: CloudRain, label: 'Rain' },
  { id: 'forest', icon: Trees, label: 'Forest' }, 
];

const AmbientToggle = () => {
  const [activeSound, setActiveSound] = React.useState('none');

  const toggleSound = (soundId) => {
    setActiveSound(soundId);
    if (soundId === 'none') {
      audioEngine.stopAmbient(2); // CHANGED from stopAll
    } else {
      audioEngine.init(); 
      audioEngine.playAmbient(soundId, 0.6);
    }
  };

  return (
    // Changed from 'absolute' to a flex container
    <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
      {sounds.map((s) => {
        const Icon = s.icon;
        return (
          <button
            key={s.id}
            onClick={() => toggleSound(s.id)}
            title={s.label}
            className={clsx(
              "p-3 rounded-xl transition-all duration-200",
              activeSound === s.id
                ? "bg-white text-black shadow-lg scale-105"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            )}
          >
            <Icon size={18} />
          </button>
        );
      })}
    </div>
  );
};

export default AmbientToggle;