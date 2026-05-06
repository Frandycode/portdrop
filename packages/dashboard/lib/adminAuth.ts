/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — admin credential hashing and Redis storage
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createHash, randomBytes, pbkdf2Sync } from 'crypto';
import { Redis } from '@upstash/redis';

const REDIS_KEY = 'admin:credentials';
const ITERATIONS = 100_000;
const KEYLEN     = 64;
const DIGEST     = 'sha512';

export interface AdminCredentials {
  passwordHash: string;
  salt:         string;
  createdAt:    string;
  updatedAt:    string;
}

function getRedis(): Redis {
  return new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt ?? randomBytes(32).toString('hex');
  const hash = pbkdf2Sync(password, s, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return { hash, salt: s };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: computed } = hashPassword(password, salt);
  return timingSafeEqual(computed, hash);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  let result = 0;
  for (let i = 0; i < bufA.length; i++) result |= bufA[i] ^ bufB[i];
  return result === 0;
}

export async function getAdminCredentials(): Promise<AdminCredentials | null> {
  const redis = getRedis();
  const raw = await redis.get<string>(REDIS_KEY);
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw as AdminCredentials;
  } catch {
    return null;
  }
}

export async function saveAdminCredentials(password: string): Promise<void> {
  const redis = getRedis();
  const existing = await getAdminCredentials();
  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();
  const creds: AdminCredentials = {
    passwordHash: hash,
    salt,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await redis.set(REDIS_KEY, JSON.stringify(creds));
}

export async function adminAccountExists(): Promise<boolean> {
  const creds = await getAdminCredentials();
  return creds !== null;
}
