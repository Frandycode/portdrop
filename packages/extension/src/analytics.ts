/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — PostHog analytics wrapper (extension side)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as vscode from 'vscode';
import { PostHog } from 'posthog-node';

// Replace with your PostHog project API key to enable analytics.
// Leave empty to disable (analytics are always off when this is empty).
const POSTHOG_API_KEY = '';

let _client: PostHog | null = null;

function client(): PostHog | null {
  if (!POSTHOG_API_KEY) return null;
  if (!vscode.env.isTelemetryEnabled) return null;
  if (!_client) {
    _client = new PostHog(POSTHOG_API_KEY, {
      host:          'https://us.i.posthog.com',
      flushAt:       1,
      flushInterval: 0,
    });
  }
  return _client;
}

export function track(event: string, properties?: Record<string, unknown>): void {
  client()?.capture({
    distinctId: vscode.env.machineId,
    event,
    properties,
  });
}

export async function shutdown(): Promise<void> {
  if (_client) {
    await _client.shutdown();
    _client = null;
  }
}
