/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — maps Node.js OS/arch to cloudflared release asset names
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as os from 'os';

export interface PlatformTarget {
  /** Filename used in the GitHub release asset URL */
  asset: string;
  /** Local filename to save the binary as */
  binaryName: string;
  /** Whether to chmod +x after download */
  needsChmod: boolean;
}

/**
 * Resolves the correct cloudflared release asset for the current OS and CPU.
 * Throws if the platform is unsupported.
 *
 * Release assets follow Cloudflare's naming convention:
 * https://github.com/cloudflare/cloudflared/releases
 */
export function resolvePlatformTarget(): PlatformTarget {
  const platform = os.platform(); // 'linux' | 'darwin' | 'win32'
  const arch     = os.arch();     // 'x64' | 'arm64' | 'arm'

  const matrix: Record<string, Record<string, PlatformTarget>> = {
    linux: {
      x64:   { asset: 'cloudflared-linux-amd64',    binaryName: 'cloudflared', needsChmod: true  },
      arm64: { asset: 'cloudflared-linux-arm64',    binaryName: 'cloudflared', needsChmod: true  },
      arm:   { asset: 'cloudflared-linux-arm',      binaryName: 'cloudflared', needsChmod: true  },
    },
    darwin: {
      x64:   { asset: 'cloudflared-darwin-amd64',   binaryName: 'cloudflared', needsChmod: true  },
      arm64: { asset: 'cloudflared-darwin-arm64',   binaryName: 'cloudflared', needsChmod: true  },
    },
    win32: {
      x64:   { asset: 'cloudflared-windows-amd64.exe', binaryName: 'cloudflared.exe', needsChmod: false },
    },
  };

  const target = matrix[platform]?.[arch];

  if (!target) {
    throw new Error(
      `[PortDrop] Unsupported platform: ${platform}/${arch}. ` +
      `Please install cloudflared manually: https://developers.cloudflare.com/cloudflared/`,
    );
  }

  return target;
}
