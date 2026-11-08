import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const resolvedSecrets = new Map();

/**
 * Resolve a secret value — returns as-is unless it starts with "op://",
 * in which case it fetches the value from 1Password CLI.
 */
export async function resolveSecret(value, { timeoutMs, signal } = {}) {
  if (!value || !value.startsWith('op://')) return value;
  signal?.throwIfAborted();
  if (resolvedSecrets.has(value)) return resolvedSecrets.get(value);
  const options = { ...(timeoutMs ? { timeout: timeoutMs } : {}), ...(signal ? { signal } : {}) };
  const { stdout } = await execFileAsync('op', ['read', value], options);
  signal?.throwIfAborted();
  const secret = stdout.trim();
  resolvedSecrets.set(value, secret);
  return secret;
}
