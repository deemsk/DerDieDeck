import { config } from '../lib/config.js';
import { refreshProfileFromAnki } from './ankiSnapshot.js';
import { buildLearnerProfilePromptContext } from './promptContext.js';
import { readProfileCache, writeProfileCache } from './store.js';

let profilePromise = null;
let warningShown = false;

function cacheAgeDays(profile) {
  const refreshed = profile?.refreshedAt ? new Date(profile.refreshedAt).getTime() : NaN;
  if (!Number.isFinite(refreshed)) {
    return Infinity;
  }

  return (Date.now() - refreshed) / (24 * 60 * 60 * 1000);
}

function formatCacheDate(profile) {
  if (!profile?.refreshedAt) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(profile.refreshedAt));
  } catch {
    return null;
  }
}

function buildWarningForResult(result = {}) {
  if (result.status === 'stale' && result.reason === 'sync-failed') {
    return "I couldn't check your latest Anki progress online. I'll use the Anki data available on this machine, so examples may be a little less tuned if you reviewed or added cards elsewhere.";
  }

  if (result.status === 'stale' && result.reason === 'cache-used') {
    const date = formatCacheDate(result.profile);
    return date
      ? `I couldn't refresh your Anki progress, so I'll use what I last knew from ${date}. Some examples may be a little less tuned to your current level.`
      : "I couldn't refresh your Anki progress. I'll keep going, but examples may be a little less tuned to your current level.";
  }

  if (result.status === 'unavailable' && result.reason === 'cache-too-old') {
    return "I couldn't check your latest Anki progress, and what I last knew is too old to rely on. I'll keep going, but examples may be less tuned to your current level.";
  }

  if (result.status === 'unavailable') {
    return "I couldn't check your Anki progress yet. I'll keep going, but examples may be less tuned to your current level.";
  }

  return null;
}

function withTimeout(promise, timeoutMs) {
  const timeout = Number(timeoutMs);
  if (!Number.isFinite(timeout) || timeout <= 0) {
    return promise;
  }

  let timer = null;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('Timed out while checking Anki progress'));
    }, timeout);
  });

  return Promise.race([promise, timeoutPromise])
    .finally(() => clearTimeout(timer));
}

async function resolveProfile({
  allowRefresh = true,
  allowSync = true,
} = {}) {
  if (config.knowledgeProfileEnabled === false) {
    return { status: 'disabled', profile: null, warning: null };
  }

  const query = config.knowledgeProfileQuery || 'tag:yt2anki';
  const syncBeforeRefresh = allowSync && config.knowledgeProfileSyncBeforeRefresh !== false;

  if (allowRefresh) {
    try {
      const profile = await withTimeout(
        refreshProfileFromAnki({ query, syncBeforeRefresh }),
        config.knowledgeProfileRefreshTimeoutMs
      );
      await writeProfileCache(profile);

      const status = profile.syncStatus === 'failed' ? 'stale' : 'fresh';
      const result = {
        status,
        reason: profile.syncStatus === 'failed' ? 'sync-failed' : 'anki-live',
        profile,
      };
      return {
        ...result,
        warning: buildWarningForResult(result),
      };
    } catch (err) {
      const cached = await readProfileCache();
      const maxAgeDays = Number(config.knowledgeProfileMaxCacheAgeDays || 21);
      if (cached && cacheAgeDays(cached) <= maxAgeDays) {
        const result = {
          status: 'stale',
          reason: 'cache-used',
          error: err.message,
          profile: cached,
        };
        return {
          ...result,
          warning: buildWarningForResult(result),
        };
      }

      const result = {
        status: 'unavailable',
        reason: cached ? 'cache-too-old' : 'refresh-failed',
        error: err.message,
        profile: cached || null,
      };
      return {
        ...result,
        warning: buildWarningForResult(result),
      };
    }
  }

  const cached = await readProfileCache();
  if (!cached) {
    const result = { status: 'unavailable', reason: 'no-cache', profile: null };
    return {
      ...result,
      warning: buildWarningForResult(result),
    };
  }

  const result = { status: 'stale', reason: 'cache-used', profile: cached };
  return {
    ...result,
    warning: buildWarningForResult(result),
  };
}

export async function getLearnerProfilePromptContext({
  target = {},
  allowRefresh = true,
  allowSync = true,
} = {}) {
  if (!profilePromise) {
    profilePromise = resolveProfile({ allowRefresh, allowSync });
  }

  const result = await profilePromise;
  const promptContext = ['fresh', 'stale'].includes(result.status)
    ? buildLearnerProfilePromptContext(result.profile, {
      target,
      maxKnownWords: config.knowledgeProfilePromptKnownWordsLimit,
    })
    : null;

  return {
    ...result,
    promptContext,
  };
}

export function consumeLearnerProfileWarning(result = {}) {
  if (!result.warning || warningShown) {
    return null;
  }

  warningShown = true;
  return result.warning;
}

export function resetLearnerProfileStateForTests() {
  profilePromise = null;
  warningShown = false;
}
