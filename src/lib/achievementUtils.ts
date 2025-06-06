// src/lib/achievementUtils.ts

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconName: string; // Changed from icon: LucideIcon to iconName: string
}

const ACHIEVEMENT_STORAGE_PREFIX = 'bizlaunch_achievement_';

/**
 * Updates the completion status of a specific achievement in localStorage.
 * @param achievementId The unique ID of the achievement (should match task ID).
 * @param completed The new completion status (true or false).
 */
export function updateAchievementStatus(achievementId: string, completed: boolean): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${ACHIEVEMENT_STORAGE_PREFIX}${achievementId}`, JSON.stringify(completed));
    } catch (e) {
      console.error("Failed to save achievement status:", e);
    }
  }
}

/**
 * Retrieves the completion status of a specific achievement from localStorage.
 * @param achievementId The unique ID of the achievement.
 * @returns True if the achievement is completed, false otherwise. Defaults to false if not found or error.
 */
export function getAchievementStatus(achievementId: string): boolean {
  if (typeof window === 'undefined') {
    return false; // Cannot access localStorage on server
  }
  try {
    const status = localStorage.getItem(`${ACHIEVEMENT_STORAGE_PREFIX}${achievementId}`);
    return status ? JSON.parse(status) === true : false;
  } catch (e) {
    console.error("Failed to retrieve achievement status:", e);
    return false;
  }
}

/**
 * Clears all achievement statuses from localStorage.
 * Useful for resetting progress.
 */
export function clearAllAchievementStatuses(): void {
  if (typeof window !== 'undefined') {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(ACHIEVEMENT_STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error("Failed to clear achievement statuses:", e);
    }
  }
}
