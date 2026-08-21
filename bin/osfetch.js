#!/usr/bin/env node
import { run } from '../src/index.js';
import { parseArgs, getHelpText } from '../src/cli.js';

const argv = process.argv.slice(2);
const flags = parseArgs(argv);

if (flags.unknown) {
  console.error(`Error: unknown flag ${flags.unknown}`);
  console.error(getHelpText());
  process.exit(1);
}

try {
  const output = await run(argv);
  if (output !== undefined && output !== null) {
    console.log(output);
  }
} catch (err) {
  console.error(err?.message || String(err));
  process.exit(1);
}
