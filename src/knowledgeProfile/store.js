import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { config } from '../lib/config.js';

const PROFILE_CACHE_FILENAME = 'learner-profile.json';

export function getProfileCachePath() {
  return join(config.dataDir, PROFILE_CACHE_FILENAME);
}

export async function readProfileCache() {
  try {
    const content = await readFile(getProfileCachePath(), 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function writeProfileCache(profile) {
  await mkdir(config.dataDir, { recursive: true });
  await writeFile(getProfileCachePath(), `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
  return profile;
}
