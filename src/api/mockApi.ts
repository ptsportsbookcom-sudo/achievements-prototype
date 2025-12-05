import type {
  Achievement,
  Player,
  PlayerAchievementProgress,
  TransactionLog,
  PlayerWallet,
  TriggerType,
  VerticalType,
} from '../types';

const STORAGE_KEYS = {
  ACHIEVEMENTS: 'achievements',
  PLAYERS: 'players',
  PROGRESS: 'player_achievement_progress',
  TRANSACTIONS: 'transaction_logs',
  WALLETS: 'player_wallets',
};

// In-memory fallback
let inMemoryData: {
  achievements: Achievement[];
  players: Player[];
  progress: PlayerAchievementProgress[];
  transactions: TransactionLog[];
  wallets: PlayerWallet[];
} = {
  achievements: [],
  players: [],
  progress: [],
  transactions: [],
  wallets: [],
};

// Initialize default player
const DEFAULT_PLAYER_ID = 'player-1';

function initDefaultPlayer() {
  const players = getFromStorage<Player[]>(STORAGE_KEYS.PLAYERS, []);
  if (players.length === 0) {
    const defaultPlayer: Player = {
      id: DEFAULT_PLAYER_ID,
      name: 'Demo Player',
      email: 'player@demo.com',
    };
    saveToStorage(STORAGE_KEYS.PLAYERS, [defaultPlayer]);
  }

  const wallets = getFromStorage<PlayerWallet[]>(STORAGE_KEYS.WALLETS, []);
  if (!wallets.find(w => w.playerId === DEFAULT_PLAYER_ID)) {
    wallets.push({ playerId: DEFAULT_PLAYER_ID, rewardPoints: 0 });
    saveToStorage(STORAGE_KEYS.WALLETS, wallets);
  }
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item) as T;
    }
  } catch (e) {
    console.error('Error reading from localStorage:', e);
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

function loadData() {
  inMemoryData = {
    achievements: getFromStorage<Achievement[]>(STORAGE_KEYS.ACHIEVEMENTS, []),
    players: getFromStorage<Player[]>(STORAGE_KEYS.PLAYERS, []),
    progress: getFromStorage<PlayerAchievementProgress[]>(STORAGE_KEYS.PROGRESS, []),
    transactions: getFromStorage<TransactionLog[]>(STORAGE_KEYS.TRANSACTIONS, []),
    wallets: getFromStorage<PlayerWallet[]>(STORAGE_KEYS.WALLETS, []),
  };
  initDefaultPlayer();
}

function saveData() {
  saveToStorage(STORAGE_KEYS.ACHIEVEMENTS, inMemoryData.achievements);
  saveToStorage(STORAGE_KEYS.PLAYERS, inMemoryData.players);
  saveToStorage(STORAGE_KEYS.PROGRESS, inMemoryData.progress);
  saveToStorage(STORAGE_KEYS.TRANSACTIONS, inMemoryData.transactions);
  saveToStorage(STORAGE_KEYS.WALLETS, inMemoryData.wallets);
}

// Initialize on load
loadData();

// API Functions
export const api = {
  // Achievements
  getAchievements: (): Achievement[] => {
    loadData();
    return inMemoryData.achievements;
  },

  getAchievement: (id: string): Achievement | undefined => {
    loadData();
    return inMemoryData.achievements.find(a => a.id === id);
  },

  createAchievement: (achievement: Omit<Achievement, 'id' | 'createdAt'>): Achievement => {
    loadData();
    const newAchievement: Achievement = {
      ...achievement,
      id: `ach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    inMemoryData.achievements.push(newAchievement);
    saveData();
    return newAchievement;
  },

  updateAchievement: (id: string, updates: Partial<Achievement>): Achievement | null => {
    loadData();
    const index = inMemoryData.achievements.findIndex(a => a.id === id);
    if (index === -1) return null;
    inMemoryData.achievements[index] = {
      ...inMemoryData.achievements[index],
      ...updates,
    };
    saveData();
    return inMemoryData.achievements[index];
  },

  deleteAchievement: (id: string): boolean => {
    loadData();
    const index = inMemoryData.achievements.findIndex(a => a.id === id);
    if (index === -1) return false;
    inMemoryData.achievements.splice(index, 1);
    saveData();
    return true;
  },

  // Player Achievements
  getPlayerAchievements: (playerId: string): PlayerAchievementProgress[] => {
    loadData();
    return inMemoryData.progress.filter(p => p.playerId === playerId);
  },

  getPlayerAchievement: (playerId: string, achievementId: string): PlayerAchievementProgress | undefined => {
    loadData();
    return inMemoryData.progress.find(
      p => p.playerId === playerId && p.achievementId === achievementId
    );
  },

  updatePlayerProgress: (
    playerId: string,
    achievementId: string,
    progress: number,
    currentValue: number,
    targetValue: number
  ): PlayerAchievementProgress => {
    loadData();
    let existing = inMemoryData.progress.find(
      p => p.playerId === playerId && p.achievementId === achievementId
    );

    const completed = progress >= 100;
    const wasCompleted = existing?.completed || false;

    if (existing) {
      existing.progress = progress;
      existing.currentValue = currentValue;
      existing.targetValue = targetValue;
      existing.lastUpdate = new Date().toISOString();
      existing.completed = completed;
    } else {
      existing = {
        playerId,
        achievementId,
        progress,
        currentValue,
        targetValue,
        lastUpdate: new Date().toISOString(),
        completed,
        claimed: false,
      };
      inMemoryData.progress.push(existing);
    }

    // If just completed, create transaction log
    if (completed && !wasCompleted) {
      const achievement = inMemoryData.achievements.find(a => a.id === achievementId);
      if (achievement && achievement.rewardPoints) {
        const transaction: TransactionLog = {
          id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          playerId,
          achievementId,
          triggerType: achievement.trigger.type,
          vertical: achievement.vertical,
          rewardPoints: achievement.rewardPoints,
          timestamp: new Date().toISOString(),
          status: 'completed',
        };
        inMemoryData.transactions.push(transaction);
      }
    }

    saveData();
    return existing;
  },

  claimReward: (playerId: string, achievementId: string): boolean => {
    loadData();
    const progress = inMemoryData.progress.find(
      p => p.playerId === playerId && p.achievementId === achievementId
    );
    if (!progress || !progress.completed || progress.claimed) {
      return false;
    }

    const achievement = inMemoryData.achievements.find(a => a.id === achievementId);
    if (!achievement || !achievement.rewardPoints) {
      return false;
    }

    // Update wallet
    let wallet = inMemoryData.wallets.find(w => w.playerId === playerId);
    if (!wallet) {
      wallet = { playerId, rewardPoints: 0 };
      inMemoryData.wallets.push(wallet);
    }
    wallet.rewardPoints += achievement.rewardPoints;

    // Mark as claimed
    progress.claimed = true;

    // Update transaction status
    const transaction = inMemoryData.transactions.find(
      t => t.playerId === playerId && t.achievementId === achievementId && t.status === 'completed'
    );
    if (transaction) {
      transaction.status = 'claimed';
    }

    saveData();
    return true;
  },

  // Transaction Logs
  getTransactionLogs: (): TransactionLog[] => {
    loadData();
    return inMemoryData.transactions;
  },

  // Wallet
  getWallet: (playerId: string): PlayerWallet => {
    loadData();
    let wallet = inMemoryData.wallets.find(w => w.playerId === playerId);
    if (!wallet) {
      wallet = { playerId, rewardPoints: 0 };
      inMemoryData.wallets.push(wallet);
      saveData();
    }
    return wallet;
  },

  // Simulation helpers
  simulateAction: (
    playerId: string,
    action: {
      type: TriggerType;
      vertical?: VerticalType;
      amount?: number;
      verificationType?: 'email' | 'phone' | 'kyc';
      // win-related
      isWin?: boolean;
      winAmount?: number;
      // game metadata
      provider?: string;
      category?: string;
      gameId?: string;
      sportType?: string;
      country?: string;
      league?: string;
      eventId?: string;
      marketType?: string;
      // other metrics
      isWithdrawal?: boolean;
      referrals?: number;
      profileCompleted?: boolean;
      accountAgeDays?: number;
      netDelta?: number; // positive for win, negative for loss
    }
  ): void => {
    loadData();
    const activeAchievements = inMemoryData.achievements.filter(a => a.status === 'active');
    
    for (const achievement of activeAchievements) {
      // Check if achievement matches the action
      if (achievement.trigger.type !== action.type) continue;
      
      // Check vertical match
      if (achievement.vertical === 'cross_vertical') {
        // Cross-vertical matches any vertical
      } else if (action.vertical && achievement.vertical !== action.vertical) {
        continue;
      }

      // Helper to evaluate filters for game-dependent triggers
      const matchesFilters = (): boolean => {
        if (!achievement.filters) return true;

        // Casino / Live casino filters
        if (achievement.vertical === 'casino' || achievement.vertical === 'live_casino') {
          const filters = achievement.filters as any;
          if (filters.providers?.length && action.provider && !filters.providers.includes(action.provider)) return false;
          if (filters.gameCategories?.length && action.category && !filters.gameCategories.includes(action.category)) return false;
          if (filters.games?.length && action.gameId && !filters.games.includes(action.gameId)) return false;
        }

        // Sportsbook filters
        if (achievement.vertical === 'sportsbook') {
          const filters = achievement.filters as any;
          if (filters.sportTypes?.length && action.sportType && !filters.sportTypes.includes(action.sportType)) return false;
          if (filters.countries?.length && action.country && !filters.countries.includes(action.country)) return false;
          if (filters.leagues?.length && action.league && !filters.leagues.includes(action.league)) return false;
          if (filters.events?.length && action.eventId && !filters.events.includes(action.eventId)) return false;
          if (filters.marketTypes?.length && action.marketType && !filters.marketTypes.includes(action.marketType)) return false;
        }

        // Cross-vertical allows combined filters
        if (achievement.vertical === 'cross_vertical') {
          const filters = achievement.filters as any;
          if (filters?.casino) {
            if (filters.casino.providers?.length && action.provider && !filters.casino.providers.includes(action.provider)) return false;
            if (filters.casino.gameCategories?.length && action.category && !filters.casino.gameCategories.includes(action.category)) return false;
            if (filters.casino.games?.length && action.gameId && !filters.casino.games.includes(action.gameId)) return false;
          }
          if (filters?.sports) {
            if (filters.sports.sportTypes?.length && action.sportType && !filters.sports.sportTypes.includes(action.sportType)) return false;
            if (filters.sports.countries?.length && action.country && !filters.sports.countries.includes(action.country)) return false;
            if (filters.sports.leagues?.length && action.league && !filters.sports.leagues.includes(action.league)) return false;
            if (filters.sports.events?.length && action.eventId && !filters.sports.events.includes(action.eventId)) return false;
            if (filters.sports.marketTypes?.length && action.marketType && !filters.sports.marketTypes.includes(action.marketType)) return false;
          }
        }

        return true;
      };

      let shouldUpdate = false;
      let newValue = 0;
      let targetValue = 0;

      switch (achievement.trigger.type) {
        case 'login_streak':
          // For simulation, increment by 1 day
          const existingProgress = inMemoryData.progress.find(
            p => p.playerId === playerId && p.achievementId === achievement.id
          );
          newValue = (existingProgress?.currentValue || 0) + 1;
          targetValue = achievement.trigger.days || 1;
          shouldUpdate = true;
          break;

        case 'game_turnover': {
          if (action.amount !== undefined) {
            // Only count turnover if it meets the minimum per-transaction amount (if set)
            const meetsMinimum =
              achievement.trigger.minimumAmount === undefined ||
              action.amount >= (achievement.trigger.minimumAmount || 0);

            if (meetsMinimum) {
              const existingProgress = inMemoryData.progress.find(
                p => p.playerId === playerId && p.achievementId === achievement.id
              );
              // For turnover, quantity represents the target total turnover amount
              newValue = (existingProgress?.currentValue || 0) + action.amount;
              targetValue =
                achievement.trigger.quantity ||
                achievement.trigger.minimumAmount ||
                0;
              shouldUpdate = targetValue > 0;
            }
          }
          break;
        }

        case 'game_transaction': {
          if (action.amount !== undefined) {
            // Count transactions; respect minimum per-transaction amount if provided
            const meetsMinimum =
              achievement.trigger.minimumAmount === undefined ||
              action.amount >= (achievement.trigger.minimumAmount || 0);

            if (meetsMinimum) {
              const existingProgress = inMemoryData.progress.find(
                p => p.playerId === playerId && p.achievementId === achievement.id
              );
              newValue = (existingProgress?.currentValue || 0) + 1;
              targetValue = achievement.trigger.quantity || 1;
              shouldUpdate = true;
            }
          }
          break;
        }

        case 'deposit':
          if (action.amount !== undefined) {
            const existingProgress = inMemoryData.progress.find(
              p => p.playerId === playerId && p.achievementId === achievement.id
            );
            newValue = (existingProgress?.currentValue || 0) + 1; // Count
            targetValue = achievement.trigger.numberOfDeposits || 1;
            shouldUpdate = true;
          }
          break;

        case 'user_verification':
          if (action.verificationType === achievement.trigger.verificationType) {
            newValue = 1;
            targetValue = 1;
            shouldUpdate = true;
          }
          break;

        // New game-dependent metrics
        case 'winning_bets_count': {
          if (action.isWin && matchesFilters()) {
            const existingProgress = inMemoryData.progress.find(
              p => p.playerId === playerId && p.achievementId === achievement.id
            );
            newValue = (existingProgress?.currentValue || 0) + 1;
            targetValue = achievement.trigger.winningBetsTarget || 1;
            shouldUpdate = true;
          }
          break;
        }

        case 'total_win_amount': {
          if (action.isWin && action.winAmount !== undefined && matchesFilters()) {
            const existingProgress = inMemoryData.progress.find(
              p => p.playerId === playerId && p.achievementId === achievement.id
            );
            newValue = (existingProgress?.currentValue || 0) + (action.winAmount || 0);
            targetValue = achievement.trigger.totalWinAmountTarget || 0;
            shouldUpdate = targetValue > 0;
          }
          break;
        }

        case 'max_single_win': {
          if (action.isWin && action.winAmount !== undefined && matchesFilters()) {
            const existingProgress = inMemoryData.progress.find(
              p => p.playerId === playerId && p.achievementId === achievement.id
            );
            const currentMax = existingProgress?.currentValue || 0;
            newValue = Math.max(currentMax, action.winAmount);
            targetValue = achievement.trigger.maxSingleWinMinimum || 0;
            shouldUpdate = targetValue > 0 && newValue >= targetValue;
            // For max win we treat completion as hitting/exceeding the threshold
            if (shouldUpdate) {
              const progress = 100;
              api.updatePlayerProgress(playerId, achievement.id, progress, newValue, targetValue);
              continue;
            }
          }
          break;
        }

        case 'consecutive_wins': {
          if (action.isWin !== undefined) {
            const existingProgress = inMemoryData.progress.find(
              p => p.playerId === playerId && p.achievementId === achievement.id
            );
            const currentStreak = action.isWin ? (existingProgress?.currentValue || 0) + 1 : 0;
            newValue = currentStreak;
            targetValue = achievement.trigger.winStreakTarget || 1;
            shouldUpdate = true;
          }
          break;
        }

        case 'specific_game_engagement': {
          if (matchesFilters()) {
            const targetId = achievement.trigger.specificGameId || achievement.trigger.specificEventId;
            const matchesTarget =
              (targetId && (action.gameId === targetId || action.eventId === targetId)) ||
              (!targetId); // if not set, count all engagements that pass filters

            if (matchesTarget) {
              const existingProgress = inMemoryData.progress.find(
                p => p.playerId === playerId && p.achievementId === achievement.id
              );
              newValue = (existingProgress?.currentValue || 0) + 1;
              targetValue = achievement.trigger.specificGameTargetCount || 1;
              shouldUpdate = true;
            }
          }
          break;
        }

        case 'market_specific_bets': {
          if (matchesFilters()) {
            const requiredMarket = achievement.trigger.marketTypeRequired;
            if (!requiredMarket || action.marketType === requiredMarket) {
              const existingProgress = inMemoryData.progress.find(
                p => p.playerId === playerId && p.achievementId === achievement.id
              );
              newValue = (existingProgress?.currentValue || 0) + 1;
              targetValue = achievement.trigger.quantity || 1;
              shouldUpdate = true;
            }
          }
          break;
        }

        // New non-game-dependent metrics
        case 'total_deposit_amount': {
          if (action.amount !== undefined) {
            const existingProgress = inMemoryData.progress.find(
              p => p.playerId === playerId && p.achievementId === achievement.id
            );
            newValue = (existingProgress?.currentValue || 0) + action.amount;
            targetValue = achievement.trigger.totalDepositAmountTarget || 0;
            shouldUpdate = targetValue > 0;
          }
          break;
        }

        case 'withdrawal': {
          if (action.isWithdrawal) {
            const existingProgress = inMemoryData.progress.find(
              p => p.playerId === playerId && p.achievementId === achievement.id
            );
            const countTarget = achievement.trigger.withdrawalCountTarget;
            const amountTarget = achievement.trigger.withdrawalAmountTarget;

            let progressByCount: number | null = null;
            let progressByAmount: number | null = null;

            const nextCount = (existingProgress?.currentValue || 0) + 1;
            const nextAmount = (existingProgress?.targetValue || 0) + (action.amount || 0);

            if (countTarget) {
              progressByCount = Math.min(100, (nextCount / countTarget) * 100);
            }
            if (amountTarget) {
              progressByAmount = Math.min(100, (nextAmount / amountTarget) * 100);
            }

            // Choose the better progress if both exist
            if (progressByCount !== null || progressByAmount !== null) {
              const chosenProgress = Math.max(progressByCount || 0, progressByAmount || 0);
              newValue = progressByAmount !== null ? nextAmount : nextCount;
              targetValue = progressByAmount !== null ? (amountTarget || 1) : (countTarget || 1);
              shouldUpdate = true;
              api.updatePlayerProgress(
                playerId,
                achievement.id,
                chosenProgress,
                newValue,
                targetValue
              );
              continue;
            }
          }
          break;
        }

        case 'referral_count': {
          const increment = action.referrals || 1;
          const existingProgress = inMemoryData.progress.find(
            p => p.playerId === playerId && p.achievementId === achievement.id
          );
          newValue = (existingProgress?.currentValue || 0) + increment;
          targetValue = achievement.trigger.referralCountTarget || 1;
          shouldUpdate = true;
          break;
        }

        case 'account_longevity': {
          if (action.accountAgeDays !== undefined) {
            newValue = action.accountAgeDays;
            targetValue = achievement.trigger.accountAgeDaysTarget || 0;
            shouldUpdate = targetValue > 0;
          }
          break;
        }

        case 'profile_completion': {
          if (action.profileCompleted) {
            newValue = 1;
            targetValue = 1;
            shouldUpdate = true;
          }
          break;
        }

        case 'net_result': {
          if (action.netDelta !== undefined) {
            const existingProgress = inMemoryData.progress.find(
              p => p.playerId === playerId && p.achievementId === achievement.id
            );
            const current = existingProgress?.currentValue || 0;
            newValue = current + action.netDelta;

            const targets: number[] = [];
            if (achievement.trigger.netWinTarget !== undefined && achievement.trigger.netWinTarget > 0) {
              targets.push(achievement.trigger.netWinTarget);
            }
            if (achievement.trigger.netLossTarget !== undefined && achievement.trigger.netLossTarget < 0) {
              targets.push(achievement.trigger.netLossTarget);
            }

            if (targets.length) {
              // Check completion against whichever target is closer to being met
              const completion = targets.some(t => (t > 0 ? newValue >= t : newValue <= t));
              targetValue = targets[0];
              shouldUpdate = true;
              const progress = completion ? 100 : Math.min(100, Math.abs((newValue / targetValue) * 100));
              api.updatePlayerProgress(playerId, achievement.id, progress, newValue, targetValue);
              continue;
            }
          }
          break;
        }
      }

      if (shouldUpdate && targetValue > 0) {
        const progress = Math.min(100, (newValue / targetValue) * 100);
        api.updatePlayerProgress(playerId, achievement.id, progress, newValue, targetValue);
      }
    }
  },
};

