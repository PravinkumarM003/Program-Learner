import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

const getDayDiff = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  // Use local time for "calendar day"
  const d1Date = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const d2Date = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
  
  const diffTime = Math.abs(d2Date.getTime() - d1Date.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export function useStreak() {
  const user = useStore(s => s.user);
  const [streakData, setStreakData] = useState(null);

  useEffect(() => {
    if (!user) return;

    const streakKey = `pl_streak_${user.id}`;
    const today = new Date().toISOString();

    let data = JSON.parse(localStorage.getItem(streakKey) || 'null');

    if (!data) {
      data = { lastLoginDate: today, currentStreak: 1, showPopup: 'INITIAL' };
      localStorage.setItem(streakKey, JSON.stringify(data));
      setStreakData(data);
      return;
    }

    const diff = getDayDiff(data.lastLoginDate, today);

    if (diff === 0) {
      // Same day, no streak update, no popup
      setStreakData({ ...data, showPopup: false });
    } else if (diff < 3) {
      // diff is 1 or 2. Consecutive or missed 1 day -> Streak continues.
      const newData = {
        lastLoginDate: today,
        currentStreak: data.currentStreak + 1,
        showPopup: 'INCREMENT',
      };
      localStorage.setItem(streakKey, JSON.stringify(newData));
      setStreakData(newData);
    } else {
      // diff >= 3 -> Reset streak
      const newData = {
        lastLoginDate: today,
        currentStreak: 1,
        showPopup: 'RESET',
      };
      localStorage.setItem(streakKey, JSON.stringify(newData));
      setStreakData(newData);
    }
  }, [user]);

  const dismissPopup = () => {
    if (streakData && user) {
      const streakKey = `pl_streak_${user.id}`;
      const newData = { ...streakData, showPopup: false };
      localStorage.setItem(streakKey, JSON.stringify(newData));
      setStreakData(newData);
    }
  };

  return { streakData, dismissPopup };
}
