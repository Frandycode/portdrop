/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — QR code generation, base64 output for webview
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as QRCode from 'qrcode';

/**
 * Converts a session URL into a base64-encoded PNG data URI
 * suitable for rendering in a VS Code webview <img> tag.
 *
 * @param url - The public session URL to encode
 * @returns A data URI string: `data:image/png;base64,...`
 */
export async function generateQRDataUri(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark:  '#020617', // PortDrop navy-black
      light: '#ffffff',
    },
  });
}
