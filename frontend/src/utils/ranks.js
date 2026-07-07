export function getXpDetails(xp) {
  if (typeof xp !== 'number' || xp < 0) xp = 0;

  // Simple exponential curve for levels: Level = Math.floor(sqrt(xp / 20)) + 1
  const level = Math.floor(Math.sqrt(xp / 20)) + 1;
  const currentLevelXpStart = Math.pow(level - 1, 2) * 20;
  const nextLevelXpStart = Math.pow(level, 2) * 20;
  
  const xpInCurrentLevel = xp - currentLevelXpStart;
  const xpNeededForNextLevel = nextLevelXpStart - currentLevelXpStart;
  const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100));

  let rankName = 'Novice';
  let rankBadge = '🥉';
  let rankColor = 'text-amber-600';

  if (level >= 30) {
    rankName = 'Grandmaster';
    rankBadge = '👑';
    rankColor = 'text-red-500';
  } else if (level >= 20) {
    rankName = 'Diamond';
    rankBadge = '💎';
    rankColor = 'text-cyan-400';
  } else if (level >= 10) {
    rankName = 'Gold';
    rankBadge = '🥇';
    rankColor = 'text-yellow-400';
  } else if (level >= 5) {
    rankName = 'Silver';
    rankBadge = '🥈';
    rankColor = 'text-slate-300';
  } else {
    rankName = 'Bronze';
    rankBadge = '🥉';
    rankColor = 'text-amber-700';
  }

  return {
    level,
    rankName,
    rankBadge,
    rankColor,
    progressPercent,
    currentLevelXpStart,
    nextLevelXpStart,
    xpNeededForNextLevel,
    xpInCurrentLevel
  };
}
