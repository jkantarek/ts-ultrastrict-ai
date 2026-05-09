#!/usr/bin/env node
// script/coverage-detail.mjs
// Parse coverage/coverage-final.json and emit per-file, per-uncovered-branch
// detail to help AI agents and developers act on coverage failures immediately.
//
// Usage: node script/coverage-detail.mjs [--no-color]
//
// Reads coverage/coverage-final.json written by @vitest/coverage-v8 (json reporter).
// Emits files whose branch or function coverage falls below the 98% threshold,
// listing each uncovered branch arm and uncovered function by line number.

import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const THRESHOLD = 98;
const COVERAGE_FILE = 'coverage/coverage-final.json';
const USE_COLOR = !process.argv.includes('--no-color') && !process.env.NO_COLOR;

const BOLD = USE_COLOR ? '\x1b[1m' : '';
const YELLOW = USE_COLOR ? '\x1b[33m' : '';
const CYAN = USE_COLOR ? '\x1b[36m' : '';
const RESET = USE_COLOR ? '\x1b[0m' : '';

/**
 * Human-readable label for a branch arm given its type and position.
 * @param {string} type  Istanbul branch type (if, cond-expr, binary-expr, switch, default-arg)
 * @param {number} armIndex  Zero-based arm index within this branch entry
 * @param {number} armCount  Total number of arms for this branch entry
 * @returns {string}
 */
function branchArmLabel(type, armIndex, armCount) {
  if (type === 'if') {
    return armIndex === 0 ? 'true branch (consequent)' : 'false branch (else/alternate)';
  }
  if (type === 'cond-expr') {
    return armIndex === 0 ? 'truthy arm' : 'falsy arm';
  }
  if (type === 'binary-expr') {
    if (armCount === 2) {
      return armIndex === 0
        ? 'left operand (short-circuit path)'
        : 'right operand (full-evaluation path)';
    }
    return armIndex === armCount - 1
      ? `operand ${armIndex} (full evaluation)`
      : `operand ${armIndex} (short-circuit)`;
  }
  if (type === 'switch') {
    return armIndex === 0 ? 'default case' : `case ${armIndex}`;
  }
  if (type === 'default-arg') {
    return armIndex === 0 ? 'argument provided (no default)' : 'default value used';
  }
  return `arm ${armIndex}`;
}

/**
 * Compute branch coverage percentage from Istanbul b-map.
 * @param {Record<string, number[]>} b
 * @returns {number} 0–100
 */
function branchPercent(b) {
  let total = 0;
  let covered = 0;
  for (const counts of Object.values(b)) {
    for (const count of counts) {
      total += 1;
      if (count > 0) covered += 1;
    }
  }
  return total === 0 ? 100 : (covered / total) * 100;
}

/**
 * Compute function coverage percentage from Istanbul f-map.
 * @param {Record<string, number>} f
 * @returns {number} 0–100
 */
function fnPercent(f) {
  const vals = Object.values(f);
  if (vals.length === 0) return 100;
  const covered = vals.filter((c) => c > 0).length;
  return (covered / vals.length) * 100;
}

/**
 * Return uncovered branch arms sorted by line number.
 * @param {Record<string, object>} branchMap
 * @param {Record<string, number[]>} b
 * @returns {{ line: number, type: string, label: string }[]}
 */
function uncoveredBranches(branchMap, b) {
  const gaps = [];
  for (const [id, counts] of Object.entries(b)) {
    const branch = branchMap[id];
    if (!branch) continue;
    for (let i = 0; i < counts.length; i++) {
      if (counts[i] === 0) {
        const armLoc = (branch.locations && branch.locations[i]) || branch.loc;
        gaps.push({
          line: armLoc.start.line,
          label: branchArmLabel(branch.type, i, counts.length),
          type: branch.type,
        });
      }
    }
  }
  return gaps.sort((a, b) => a.line - b.line);
}

/**
 * Return uncovered functions sorted by line number.
 * @param {Record<string, object>} fnMap
 * @param {Record<string, number>} f
 * @returns {{ line: number, name: string }[]}
 */
function uncoveredFunctions(fnMap, f) {
  const gaps = [];
  for (const [id, count] of Object.entries(f)) {
    if (count === 0) {
      const fn = fnMap[id];
      if (fn) {
        gaps.push({ line: fn.loc.start.line, name: fn.name });
      }
    }
  }
  return gaps.sort((a, b) => a.line - b.line);
}

/**
 * Emit coverage gaps for a single file. Returns true if gaps were found.
 * @param {string} filePath  Absolute path from coverage-final.json key
 * @param {object} info  Istanbul file coverage object
 * @returns {boolean}
 */
function emitFileGaps(filePath, info) {
  const bPct = branchPercent(info.b);
  const fPct = fnPercent(info.f);
  if (bPct >= THRESHOLD && fPct >= THRESHOLD) return false;

  const relPath = relative(process.cwd(), resolve(filePath));
  const pct = Math.min(bPct, fPct).toFixed(2);
  console.log(`  ${BOLD}${CYAN}${relPath}${RESET} — ${YELLOW}${pct}%${RESET}`);

  for (const { line, type, label } of uncoveredBranches(info.branchMap, info.b)) {
    console.log(`    L${line}  branch miss (${type}): ${label}`);
  }

  for (const { line, name } of uncoveredFunctions(info.fnMap, info.f)) {
    console.log(`    L${line}  function never called: ${name}`);
  }

  console.log('');
  return true;
}

function main() {
  if (!existsSync(COVERAGE_FILE)) {
    process.stderr.write(
      `coverage-detail: ${COVERAGE_FILE} not found. Run 'pnpm test:coverage' first.\n`,
    );
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(COVERAGE_FILE, 'utf-8'));
  let hasGaps = false;

  console.log('');
  console.log('  Coverage gaps (branches / functions below 98% threshold):');
  console.log('');

  for (const [filePath, info] of Object.entries(data)) {
    if (emitFileGaps(filePath, info)) hasGaps = true;
  }

  if (!hasGaps) {
    console.log('  (no coverage gaps — all files meet the 98% threshold)');
    console.log('');
  }
}

main();
