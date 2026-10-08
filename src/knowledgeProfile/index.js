import { config } from '../lib/config.js';
import { PROFILE_VERSION, refreshProfileFromAnki } from './ankiSnapshot.js';
import { buildLearnerProfilePromptContext } from './promptContext.js';
import { readProfileCache, writeProfileCache } from './store.js';

const sessions = new Map();
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
      ? `I couldn't refresh your Anki progress, so I'll use what I last knew from ${date}. Some examples may be a little less tuned to your recent practice.`
      : "I couldn't refresh your Anki progress. I'll keep going, but examples may be a little less tuned to your recent practice.";
  }

  if (result.status === 'unavailable' && result.reason === 'cache-too-old') {
    return "I couldn't check your latest Anki progress, and what I last knew is too old to rely on. I'll keep going, but examples may be less tuned to your recent practice.";
  }

  if (result.status === 'unavailable') {
    return "I couldn't check your Anki progress yet. I'll keep going, but examples may be less tuned to your recent practice.";
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

function usable(profile, query, endpoint) {
  const age = cacheAgeDays(profile);
  return profile?.version === PROFILE_VERSION && profile.sourceQuery === query &&
    profile.sourceEndpoint === endpoint && profile.cardStatus === 'ok' &&
    Array.isArray(profile.summary?.words) && age >= 0 &&
    age <= Number(config.knowledgeProfileMaxCacheAgeDays ?? 21);
}

async function resolveProfile({ allowRefresh, allowSync }) {
  const query = config.knowledgeProfileQuery || 'tag:yt2anki';
  const endpoint = config.ankiConnectUrl;
  let error;
  if (allowRefresh) {
    try {
      const profile = await withTimeout(refreshProfileFromAnki({
        query, sourceEndpoint: endpoint,
        syncBeforeRefresh: allowSync && config.knowledgeProfileSyncBeforeRefresh !== false,
      }), config.knowledgeProfileRefreshTimeoutMs);
      if (!usable(profile, query, endpoint)) throw new Error('Incomplete Anki progress snapshot');
      // Persistence failure must not discard usable live evidence.
      await writeProfileCache(profile).catch(() => {});
      const result = { status: profile.syncStatus === 'failed' ? 'stale' : 'fresh',
        reason: profile.syncStatus === 'failed' ? 'sync-failed' : 'anki-live', profile };
      return { ...result, warning: buildWarningForResult(result) };
    } catch (err) { error = err.message; }
  }
  const cached = await readProfileCache().catch(() => null);
  const result = usable(cached, query, endpoint)
    ? { status: 'stale', reason: 'cache-used', profile: cached, error }
    : { status: 'unavailable', reason: cached ? 'cache-invalid' : 'no-cache', profile: null, error };
  return { ...result, warning: buildWarningForResult(result) };
}

export async function getLearnerProfilePromptContext({ target = {}, allowRefresh = true, allowSync = true } = {}) {
  if (config.knowledgeProfileEnabled === false) return { status: 'disabled', profile: null, promptContext: null };
  const key = JSON.stringify([config.ankiConnectUrl, config.knowledgeProfileQuery, config.dataDir,
    config.knowledgeProfileMaxCacheAgeDays, config.knowledgeProfileSyncBeforeRefresh, config.knowledgeProfileRefreshTimeoutMs, allowRefresh, allowSync]);
  let session = sessions.get(key);
  if (!session || Date.now() >= session.expires) {
    session = { expires: Infinity };
    session.promise = resolveProfile({ allowRefresh, allowSync }).then((result) => {
      session.expires = Date.now() + (result.status === 'unavailable' ? 30000 : 300000);
      if (result.profile) session.expires = Math.min(session.expires,
        new Date(result.profile.refreshedAt).getTime() + Number(config.knowledgeProfileMaxCacheAgeDays ?? 21) * 86400000);
      return result;
    });
    sessions.set(key, session);
  }
  const result = await session.promise;
  return { ...result, promptContext: buildLearnerProfilePromptContext(result.profile, {
    target, maxKnownWords: config.knowledgeProfilePromptKnownWordsLimit,
  }) };
}

export async function resolveLearnerProfileForInput(rawInput, options = {}, onWarning = () => {}) {
  if (options.learnerProfileContext === false) return null;
  if (typeof options.learnerProfileContext === 'string') return options.learnerProfileContext;
  try {
    const analysis = options.analysisResult || {};
    const result = await getLearnerProfilePromptContext({
      target: { rawInput, canonical: analysis.canonical, lemma: analysis.lemma || analysis.infinitive },
      allowRefresh: options.knowledgeProfileRefresh !== false, allowSync: !options.dryRun,
    });
    const warning = consumeLearnerProfileWarning(result);
    if (warning) onWarning(warning);
    return result.promptContext;
  } catch { return null; }
}

export function consumeLearnerProfileWarning(result = {}) {
  if (!result.warning || warningShown) {
    return null;
  }

  warningShown = true;
  return result.warning;
}

export function resetLearnerProfileStateForTests() {
  sessions.clear();
  warningShown = false;
}
