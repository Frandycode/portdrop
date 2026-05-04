declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

// May only be called once per webview lifetime — module scope ensures that.
export const vscode = acquireVsCodeApi();
