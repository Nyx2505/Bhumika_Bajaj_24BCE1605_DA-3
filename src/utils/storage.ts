import { Alarm, UserPreferences } from '../types/cloudwatch';
import { INITIAL_ALARMS } from '../data/initialAlarms';

const STORAGE_KEYS = {
  ALARMS: 'cw_saved_alarms',
  LEARNING_PROGRESS: 'cw_learning_progress',
  PREFERENCES: 'cw_user_preferences',
  THEME_LEGACY: 'cw_theme'
} as const;

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  simSpeed: 1,
  environment: 'Production (us-east-1)',
  defaultTimeRange: '10m'
};

/**
 * Storage Manager for Persistent Settings
 * 
 * IMPORTANT ARCHITECTURAL RULE:
 * Large time-series metric histories (metricHistory) must strictly remain in-memory.
 * Only light configuration, user-created alarms, challenge progress, and preferences
 * are persisted to localStorage.
 */
export const StorageManager = {
  // --- Alarms ---
  loadAlarms(): Alarm[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALARMS);
      if (!data) {
        // Fallback check legacy key
        const legacy = localStorage.getItem('cloudwatch_sim_alarms');
        return legacy ? JSON.parse(legacy) : INITIAL_ALARMS;
      }
      return JSON.parse(data);
    } catch (err) {
      console.warn('Failed to load alarms from storage, falling back to defaults:', err);
      return INITIAL_ALARMS;
    }
  },

  saveAlarms(alarms: Alarm[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(alarms));
      // Keep legacy key in sync for backwards compatibility
      localStorage.setItem('cloudwatch_sim_alarms', JSON.stringify(alarms));
    } catch (err) {
      console.warn('Failed to persist alarms to localStorage:', err);
    }
  },

  clearAlarms(): void {
    localStorage.removeItem(STORAGE_KEYS.ALARMS);
    localStorage.removeItem('cloudwatch_sim_alarms');
  },

  // --- Learning Progress ---
  loadLearningProgress(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LEARNING_PROGRESS);
      if (!data) {
        const legacy = localStorage.getItem('cw_learning_challenges');
        return legacy ? JSON.parse(legacy) : [];
      }
      return JSON.parse(data);
    } catch (err) {
      console.warn('Failed to load learning progress:', err);
      return [];
    }
  },

  saveLearningProgress(completedChallengeIds: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LEARNING_PROGRESS, JSON.stringify(completedChallengeIds));
      localStorage.setItem('cw_learning_challenges', JSON.stringify(completedChallengeIds));
    } catch (err) {
      console.warn('Failed to persist learning progress:', err);
    }
  },

  clearLearningProgress(): void {
    localStorage.removeItem(STORAGE_KEYS.LEARNING_PROGRESS);
    localStorage.removeItem('cw_learning_challenges');
  },

  // --- User Preferences ---
  loadPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (data) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(data) };
      }
      // Check legacy theme
      const legacyTheme = localStorage.getItem(STORAGE_KEYS.THEME_LEGACY);
      if (legacyTheme === 'light' || legacyTheme === 'dark') {
        return { ...DEFAULT_PREFERENCES, theme: legacyTheme };
      }
      return DEFAULT_PREFERENCES;
    } catch (err) {
      console.warn('Failed to load user preferences:', err);
      return DEFAULT_PREFERENCES;
    }
  },

  savePreferences(prefs: Partial<UserPreferences>): void {
    try {
      const current = this.loadPreferences();
      const updated = { ...current, ...prefs };
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
      if (updated.theme) {
        localStorage.setItem(STORAGE_KEYS.THEME_LEGACY, updated.theme);
      }
    } catch (err) {
      console.warn('Failed to save user preferences:', err);
    }
  }
};
