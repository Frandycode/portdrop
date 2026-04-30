/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — cloudflared binary detection, validation, and auto-download
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as vscode from 'vscode';
import * as fs     from 'fs';
import * as path   from 'path';
import * as https  from 'https';
import * as os     from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { resolvePlatformTarget } from './platform';

const execFileAsync = promisify(execFile);

/** Minimum cloudflared version PortDrop requires */
const MIN_VERSION = '2024.1.0';

/**
 * Base URL for cloudflared GitHub release assets.
 * We pin to `latest` redirect so users always get a supported build.
 */
const RELEASE_BASE =
  'https://github.com/cloudflare/cloudflared/releases/latest/download';

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves the path to a usable cloudflared binary.
 *
 * Resolution order:
 *  1. System PATH  (`which cloudflared` / `where cloudflared`)
 *  2. Extension global storage directory (previously downloaded by PortDrop)
 *  3. Auto-download to extension global storage with user confirmation
 *
 * @param context - VS Code extension context (used for globalStorageUri)
 * @returns Absolute path to a valid cloudflared binary
 * @throws If no binary can be found or the user declines the download
 */
export async function resolveCloudflared(
  context: vscode.ExtensionContext,
): Promise<string> {
  // ── 1. Check system PATH ──────────────────────────────────────────────────
  const systemPath = await findOnPath();
  if (systemPath) {
    const valid = await validateBinary(systemPath);
    if (valid) {
      console.log(`[PortDrop] Using system cloudflared: ${systemPath}`);
      return systemPath;
    }
    console.warn(`[PortDrop] System cloudflared found but version too old: ${systemPath}`);
  }

  // ── 2. Check extension global storage ────────────────────────────────────
  const storedPath = getStoredBinaryPath(context);
  if (fs.existsSync(storedPath)) {
    const valid = await validateBinary(storedPath);
    if (valid) {
      console.log(`[PortDrop] Using stored cloudflared: ${storedPath}`);
      return storedPath;
    }
    // Stale — delete and re-download
    fs.unlinkSync(storedPath);
  }

  // ── 3. Prompt and auto-download ───────────────────────────────────────────
  return downloadCloudflared(context);
}

// ─────────────────────────────────────────────────────────────────────────────
// Internals
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the path where PortDrop stores its own cloudflared binary. */
function getStoredBinaryPath(context: vscode.ExtensionContext): string {
  const target = resolvePlatformTarget();
  const storageDir = context.globalStorageUri.fsPath;
  return path.join(storageDir, target.binaryName);
}

/** Checks system PATH for cloudflared. Returns the path or null. */
async function findOnPath(): Promise<string | null> {
  const cmd = os.platform() === 'win32' ? 'where' : 'which';
  try {
    const { stdout } = await execFileAsync(cmd, ['cloudflared']);
    return stdout.trim().split('\n')[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Runs `cloudflared --version` and checks the version is acceptable.
 * Returns false if the binary is missing, corrupt, or too old.
 */
async function validateBinary(binaryPath: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(binaryPath, ['--version']);
    // stdout: "cloudflared version 2024.4.1 (built ...)"
    const match = stdout.match(/(\d+\.\d+\.\d+)/);
    if (!match) return false;
    return isVersionAtLeast(match[1], MIN_VERSION);
  } catch {
    return false;
  }
}

/** Compares semver strings. Returns true if `actual` >= `required`. */
function isVersionAtLeast(actual: string, required: string): boolean {
  const parse = (v: string) => v.split('.').map(Number);
  const [aMaj, aMin, aPatch] = parse(actual);
  const [rMaj, rMin, rPatch] = parse(required);
  if (aMaj !== rMaj) return aMaj > rMaj;
  if (aMin !== rMin) return aMin > rMin;
  return aPatch >= rPatch;
}

/**
 * Asks the user for confirmation then downloads the cloudflared binary
 * into the extension's global storage directory, with a VS Code progress
 * notification showing download progress.
 */
async function downloadCloudflared(
  context: vscode.ExtensionContext,
): Promise<string> {
  const choice = await vscode.window.showInformationMessage(
    '[PortDrop] cloudflared is required to create tunnels. Download it now? (~30 MB)',
    { modal: true },
    'Download',
    'Cancel',
  );

  if (choice !== 'Download') {
    throw new Error('[PortDrop] cloudflared download declined by user.');
  }

  const target     = resolvePlatformTarget();
  const storageDir = context.globalStorageUri.fsPath;
  const destPath   = path.join(storageDir, target.binaryName);
  const url        = `${RELEASE_BASE}/${target.asset}`;

  // Ensure storage directory exists
  fs.mkdirSync(storageDir, { recursive: true });

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'PortDrop: Downloading cloudflared',
      cancellable: false,
    },
    (progress) => downloadFile(url, destPath, progress),
  );

  // Make executable on Unix
  if (target.needsChmod) {
    fs.chmodSync(destPath, 0o755);
  }

  // Final validation
  const valid = await validateBinary(destPath);
  if (!valid) {
    fs.unlinkSync(destPath);
    throw new Error('[PortDrop] Downloaded cloudflared binary failed validation.');
  }

  vscode.window.showInformationMessage('[PortDrop] cloudflared downloaded successfully.');
  return destPath;
}

/** Streams a file from `url` to `destPath`, reporting progress in percent. */
function downloadFile(
  url: string,
  destPath: string,
  progress: vscode.Progress<{ message?: string; increment?: number }>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const follow = (redirectUrl: string) => {
      https.get(redirectUrl, (res) => {
        // Follow redirects (GitHub releases do this)
        if (res.statusCode === 301 || res.statusCode === 302) {
          follow(res.headers.location!);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`[PortDrop] Download failed: HTTP ${res.statusCode}`));
          return;
        }

        const total   = parseInt(res.headers['content-length'] ?? '0', 10);
        let received  = 0;
        const dest    = fs.createWriteStream(destPath);

        res.on('data', (chunk: Buffer) => {
          received += chunk.length;
          if (total > 0) {
            const pct = Math.round((received / total) * 100);
            progress.report({ message: `${pct}%`, increment: chunk.length / total * 100 });
          }
        });

        res.pipe(dest);
        dest.on('finish', resolve);
        dest.on('error', reject);
        res.on('error', reject);
      }).on('error', reject);
    };

    follow(url);
  });
}
