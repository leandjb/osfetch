import { paint, paintBg, bg, enabled } from './ansi.js';

function isColorEnabled(opts = {}) {
  if (opts.color === false) return false;
  if (opts.noColor) return false;
  return enabled(opts);
}

function paletteRow() {
  // 8 background blocks, each 3 spaces
  const order = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
  return order.map((c) => paintBg('   ', c)).join('');
}

function buildInfoStrings(info, opts, useColor) {
  // Normalize info to array of {label, value} and extract title if present
  let lines = [];
  let username = opts.username;
  let hostname = opts.hostname;
  let title = opts.title;

  if (Array.isArray(info)) {
    // info is array of {label,value} – check if first is title-like without label?
    // If opts provides username/hostname, use those; else try to infer
    for (const item of info) {
      if (item && typeof item.label === 'string' && typeof item.value === 'string') {
        lines.push(item);
      }
    }
  } else if (info && typeof info === 'object') {
    // object case: could have keys os,kernel,etc + username/hostname
    if (info.username) username = info.username;
    if (info.hostname) hostname = info.hostname;
    if (info.host) hostname = info.host;
    if (info.user) username = info.user;
    // if info has lines array
    if (Array.isArray(info.lines)) {
      lines = info.lines;
    } else if (Array.isArray(info.infoLines)) {
      lines = info.infoLines;
    } else {
      // map known keys in order
      const order = ['os', 'kernel', 'uptime', 'shell', 'cpu', 'memory'];
      const labels = { os: 'OS', kernel: 'Kernel', uptime: 'Uptime', shell: 'Shell', cpu: 'CPU', memory: 'Memory' };
      for (const key of order) {
        if (info[key] !== undefined && info[key] !== null && info[key] !== '') {
          lines.push({ label: labels[key], value: String(info[key]) });
        }
      }
      // also handle generic entries that already are label/value
      if (lines.length === 0) {
        for (const [k, v] of Object.entries(info)) {
          if (k === 'username' || k === 'hostname' || k === 'host' || k === 'user' || v == null) continue;
          lines.push({ label: k, value: String(v) });
        }
      }
    }
  }

  // Build title
  if (!title) {
    if (username && hostname) title = `${username}@${hostname}`;
    else if (username) title = username;
    else if (hostname) title = hostname;
    else title = 'user@host';
  }

  const underline = '-'.repeat(title.length);

  const infoStrings = [];

  // Title and underline are first two lines
  if (useColor) {
    // Paint title with yellow-ish color, underline same
    infoStrings.push(paint(title, 'cyan'));
    infoStrings.push(paint(underline, 'cyan'));
  } else {
    infoStrings.push(title);
    infoStrings.push(underline);
  }

  for (const { label, value } of lines) {
    const labelPart = `${label}:`;
    if (useColor) {
      infoStrings.push(`${paint(labelPart, 'green')} ${value}`);
    } else {
      infoStrings.push(`${labelPart} ${value}`);
    }
  }

  if (useColor) {
    infoStrings.push(paletteRow());
  }

  return infoStrings;
}

export function render(info, logo, opts = {}) {
  // Allow overloaded signatures: render(info, opts) where logo is embedded in opts.logo
  // But primary is render(info, logo, opts)
  let actualLogo = logo;
  let actualOpts = opts;
  let actualInfo = info;

  // Handle case where logo is actually opts and opts is undefined (render(info, opts))
  if (logo && typeof logo === 'object' && !Array.isArray(logo.lines) && logo.lines === undefined) {
    // logo is not a logo object (no lines), treat as opts
    if (!opts || Object.keys(opts).length === 0) {
      actualOpts = logo;
      actualLogo = null;
    }
  }

  // If actualLogo is null/undefined and opts.logo exists, use it
  if (!actualLogo || !actualLogo.lines) {
    if (actualOpts && actualOpts.logo) actualLogo = actualOpts.logo;
  }

  const useColor = isColorEnabled(actualOpts);
  const noLogo = actualOpts.noLogo || actualOpts['no-logo'] || !actualLogo;

  const infoStrings = buildInfoStrings(actualInfo, actualOpts, useColor);

  if (noLogo) {
    // No logo: just info column, strip colors if needed already handled
    if (!useColor) {
      // ensure no ANSI (already not painted if useColor false)
      return infoStrings.join('\n');
    }
    return infoStrings.join('\n');
  }

  // With logo
  const logoLines = actualLogo.lines;
  const logoColors = actualLogo.colors || [];
  const gutter = '  ';
  const logoWidth = Math.max(...logoLines.map((l) => l.length), 0);
  const totalRows = Math.max(logoLines.length, infoStrings.length);
  const out = [];

  for (let i = 0; i < totalRows; i++) {
    const rawLogo = i < logoLines.length ? logoLines[i] : '';
    const paddedLogo = rawLogo.padEnd(logoWidth, ' ');
    const coloredLogo = useColor ? paint(paddedLogo, logoColors[i] || 'white') : paddedLogo;

    const infoPart = i < infoStrings.length ? infoStrings[i] : '';

    if (i < logoLines.length && i < infoStrings.length) {
      out.push(coloredLogo + gutter + infoPart);
    } else if (i < logoLines.length) {
      // only logo, no info
      // Trim trailing spaces for clean output? But keep colored logo as is, but rtrim if no info?
      out.push(useColor ? paint(rawLogo.padEnd(logoWidth, ' '), logoColors[i] || 'white') : rawLogo);
    } else {
      // only info, pad logo area with spaces
      out.push(' '.repeat(logoWidth) + gutter + infoPart);
    }
  }

  return out.join('\n');
}

export default render;
