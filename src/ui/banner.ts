import figlet from 'figlet';
import gradient from 'gradient-string';
// Embed font file for Bun standalone executable
// @ts-expect-error - Bun-specific import attribute
import fontPath from '../../node_modules/figlet/fonts/ANSI-Compact.flf' with { type: 'file' };

// Catppuccin Frappe palette colors
const bannerGradient = gradient(['#81c8be', '#99d1db', '#ca9ee6']);

// Load and register the embedded font
const fontContent = await Bun.file(fontPath).text();
figlet.parseFont('ANSI-Compact', fontContent);

/**
 * Display the ASCII art banner with gradient colors
 */
export function showBanner(): void {
  const banner = figlet.textSync('CHANGELOG', {
    font: 'ANSI-Compact',
    horizontalLayout: 'fitted'
  });

  // Indent to the right
  const indent = '  ';
  const indentedBanner = banner
    .split('\n')
    .map((line) => indent + line)
    .join('\n');

  console.log(`\n${bannerGradient(indentedBanner)}`);
  console.log();
}
