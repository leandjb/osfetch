export const fg = {
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
};

export const bg = {
  black: 40,
  red: 41,
  green: 42,
  yellow: 43,
  blue: 44,
  magenta: 45,
  cyan: 46,
  white: 47,
};

// aliases for convenience
export const colors = fg;
export const bgColors = bg;
export const FG = fg;
export const BG = bg;

/**
 * Whether colors are enabled. Honors NO_COLOR env var and { noColor } option.
 * @param {{noColor?: boolean}} [opts]
 * @returns {boolean}
 */
export function enabled(opts = {}) {
  if (process.env.NO_COLOR !== undefined) return false;
  if (opts && opts.noColor) return false;
  return true;
}

// legacy alias
export const isEnabled = enabled;

export function paint(text, color) {
  const code = fg[color];
  if (code === undefined) return text;
  return `\x1b[${code}m${text}\x1b[0m`;
}

export function paintBg(text, color) {
  const code = bg[color];
  if (code === undefined) return text;
  return `\x1b[${code}m${text}\x1b[0m`;
}

export function strip(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}
