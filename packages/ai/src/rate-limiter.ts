export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerDay: number;
  maxTokensPerDay?: number;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

interface DayEntry {
  count: number;
  tokens: number;
  resetAt: number;
}

export class RateLimiter {
  private minuteWindows = new Map<string, WindowEntry>();
  private dayWindows = new Map<string, DayEntry>();

  constructor(private readonly config: RateLimitConfig) {}

  check(userId: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const minuteKey = userId;
    const dayKey = userId;

    const minuteWindow = this.minuteWindows.get(minuteKey);
    if (minuteWindow && now < minuteWindow.resetAt) {
      if (minuteWindow.count >= this.config.maxRequestsPerMinute) {
        const waitSecs = Math.ceil((minuteWindow.resetAt - now) / 1000);
        return {
          allowed: false,
          reason: `Rate limit exceeded. Please wait ${waitSecs} seconds.`,
        };
      }
    }

    const dayWindow = this.dayWindows.get(dayKey);
    if (dayWindow && now < dayWindow.resetAt) {
      if (dayWindow.count >= this.config.maxRequestsPerDay) {
        return {
          allowed: false,
          reason: 'Daily AI request limit reached. Limit resets at midnight UTC.',
        };
      }
    }

    return { allowed: true };
  }

  record(userId: string, tokensUsed: number = 0): void {
    const now = Date.now();

    const minuteWindow = this.minuteWindows.get(userId);
    if (!minuteWindow || now >= minuteWindow.resetAt) {
      this.minuteWindows.set(userId, { count: 1, resetAt: now + 60_000 });
    } else {
      minuteWindow.count++;
    }

    const dayWindow = this.dayWindows.get(userId);
    if (!dayWindow || now >= dayWindow.resetAt) {
      const midnight = new Date();
      midnight.setUTCHours(24, 0, 0, 0);
      this.dayWindows.set(userId, {
        count: 1,
        tokens: tokensUsed,
        resetAt: midnight.getTime(),
      });
    } else {
      dayWindow.count++;
      dayWindow.tokens += tokensUsed;
    }
  }

  getStatus(userId: string): {
    minuteRequestsUsed: number;
    dayRequestsUsed: number;
    dayTokensUsed: number;
  } {
    const now = Date.now();
    const minuteWindow = this.minuteWindows.get(userId);
    const dayWindow = this.dayWindows.get(userId);

    return {
      minuteRequestsUsed:
        minuteWindow && now < minuteWindow.resetAt ? minuteWindow.count : 0,
      dayRequestsUsed: dayWindow && now < dayWindow.resetAt ? dayWindow.count : 0,
      dayTokensUsed: dayWindow && now < dayWindow.resetAt ? dayWindow.tokens : 0,
    };
  }
}

export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  maxRequestsPerMinute: 5,
  maxRequestsPerDay: 50,
  maxTokensPerDay: 100_000,
};
