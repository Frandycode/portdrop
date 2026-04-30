/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — workspace file watcher for Code View and rebuild detection
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as vscode from 'vscode';

/** Patterns that are NEVER streamed regardless of user config. */
const HARD_BLOCKLIST = [
  '**/.env',
  '**/.env.*',
  '**/node_modules/**',
  '**/*.key',
  '**/*.pem',
  '**/*.secret',
  '**/credentials.*',
];

/**
 * Watches workspace text documents for changes.
 * In Phase 2 this will broadcast diffs over the WebSocket relay.
 *
 * TODO (Phase 2):
 *  - Accept a file scope config (current file / tabs / workspace / custom)
 *  - Filter against HARD_BLOCKLIST + user blocklist before broadcasting
 *  - Emit diffs to the relay WebSocket connection
 */
export class FileWatcher implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];

  start(): void {
    const watcher = vscode.workspace.onDidChangeTextDocument((e) => {
      if (this.isBlocked(e.document.uri.fsPath)) return;
      // TODO (Phase 2): build and emit diff to relay
      console.log(`[PortDrop:FileWatcher] Changed: ${e.document.fileName}`);
    });

    this.disposables.push(watcher);
  }

  stop(): void {
    this.dispose();
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0;
  }

  private isBlocked(filePath: string): boolean {
    return HARD_BLOCKLIST.some((pattern) => {
      const regex = new RegExp(
        pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'),
      );
      return regex.test(filePath);
    });
  }
}
