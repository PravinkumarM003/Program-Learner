import { useEffect } from 'react';
import { useStreak } from '../hooks/useStreak';

const getStreakEmoji = (streak) => {
  if (streak >= 30) return '👑';
  if (streak >= 14) return '🚀';
  if (streak >= 7) return '🔥';
  if (streak >= 3) return '⚡';
  return '🌱';
};

export default function StreakPopup() {
  const { streakData, dismissPopup } = useStreak();

  useEffect(() => {
    if (streakData?.showPopup) {
      try {
        const audio = new Audio('/sounds/streak-success.mp3');
        audio.play().catch(e => {
          // Ignore autoplay blocked errors
          console.log('Audio autoplay blocked or file not found', e);
        });
      } catch (err) {
        console.log('Error playing audio', err);
      }
    }
  }, [streakData?.showPopup]);

  if (!streakData || !streakData.showPopup) return null;

  const streak = streakData.currentStreak;
  const emoji = getStreakEmoji(streak);

  let headerText = `${streak} Day Streak!`;
  let subText = "You're building awesome momentum. Keep coding daily!";

  if (streakData.showPopup === 'INITIAL') {
    headerText = "Streak Started!";
    subText = "Welcome! Log in daily to build your streak and earn rewards.";
  } else if (streakData.showPopup === 'RESET') {
    headerText = "Fresh Start!";
    subText = "You missed a few days, but you're back. Let's build that streak again!";
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div 
        className="relative w-full max-w-sm rounded-2xl p-8 text-center"
        style={{ 
          background: '#111625',
          boxShadow: '0 0 40px rgba(6, 182, 212, 0.15), inset 0 0 0 1px rgba(139, 92, 246, 0.3)' 
        }}
      >
        {/* Glow behind the modal */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500 to-violet-500 opacity-20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="text-7xl mb-4 animate-bounce">
            {emoji}
          </div>
          
          <h2 className="text-3xl font-black text-white mb-2 bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
            {headerText}
          </h2>
          
          <p className="text-sm text-slate-300 mb-8 leading-relaxed">
            {subText}
          </p>
          
          <button
            onClick={dismissPopup}
            className="w-full btn-glow rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-3.5 text-sm font-bold text-white hover:opacity-95 transition-opacity"
          >
            Let's Code!
          </button>
        </div>
      </div>
    </div>
  );
}
