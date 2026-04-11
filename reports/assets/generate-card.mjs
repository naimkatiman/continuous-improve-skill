#!/usr/bin/env node

/**
 * Generates a daily update summary card as SVG.
 * Usage: node reports/assets/generate-card.mjs
 * Output: reports/assets/update-YYYY-MM-DD.svg
 */

import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);

// Get test count
let testResult = '?/?';
try {
  const out = execSync('node --test test/*.test.mjs 2>&1', { cwd: root, encoding: 'utf8' });
  const pass = out.match(/# pass (\d+)/);
  const total = out.match(/# tests (\d+)/);
  if (pass && total) testResult = `${pass[1]}/${total[1]}`;
} catch {}

// Get recent commits
let commits = '';
try {
  commits = execSync('git log --oneline -5', { cwd: root, encoding: 'utf8' }).trim();
} catch {}
const commitLines = commits.split('\n').filter(Boolean);

// Changes this session
const changes = [
  'engines.node >= 18 in package.json',
  'CI code coverage (Node 22)',
  'CodeQL security scanning',
  'CHANGELOG v3.1.0 backfill',
  'Local social automation (bin/social.mjs)',
  'Scheduled task infrastructure',
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f0f23;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a1a3e;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#6366f1" />
      <stop offset="100%" style="stop-color:#8b5cf6" />
    </linearGradient>
  </defs>

  <rect width="800" height="520" rx="16" fill="url(#bg)"/>
  <rect x="0" y="0" width="800" height="4" rx="2" fill="url(#accent)"/>

  <!-- Header -->
  <text x="40" y="50" fill="#a5b4fc" font-family="monospace" font-size="13" font-weight="bold">DAILY IMPROVEMENT REPORT</text>
  <text x="660" y="50" fill="#6366f1" font-family="monospace" font-size="13">${today}</text>

  <!-- Project name -->
  <text x="40" y="85" fill="#ffffff" font-family="sans-serif" font-size="26" font-weight="bold">continuous-improvement</text>
  <text x="40" y="110" fill="#94a3b8" font-family="sans-serif" font-size="14">v${pkg.version} — The 7 Laws of AI Agent Discipline</text>

  <!-- Stats boxes -->
  <rect x="40" y="130" width="160" height="70" rx="10" fill="#1e1e3f" stroke="#6366f1" stroke-width="1"/>
  <text x="120" y="158" fill="#a5b4fc" font-family="monospace" font-size="11" text-anchor="middle">TESTS</text>
  <text x="120" y="185" fill="#22c55e" font-family="monospace" font-size="22" font-weight="bold" text-anchor="middle">${testResult}</text>

  <rect x="220" y="130" width="160" height="70" rx="10" fill="#1e1e3f" stroke="#6366f1" stroke-width="1"/>
  <text x="300" y="158" fill="#a5b4fc" font-family="monospace" font-size="11" text-anchor="middle">DEPENDENCIES</text>
  <text x="300" y="185" fill="#22c55e" font-family="monospace" font-size="22" font-weight="bold" text-anchor="middle">0</text>

  <rect x="400" y="130" width="160" height="70" rx="10" fill="#1e1e3f" stroke="#6366f1" stroke-width="1"/>
  <text x="480" y="158" fill="#a5b4fc" font-family="monospace" font-size="11" text-anchor="middle">STAGE</text>
  <text x="480" y="185" fill="#f59e0b" font-family="monospace" font-size="22" font-weight="bold" text-anchor="middle">SHIP</text>

  <rect x="580" y="130" width="180" height="70" rx="10" fill="#1e1e3f" stroke="#6366f1" stroke-width="1"/>
  <text x="670" y="158" fill="#a5b4fc" font-family="monospace" font-size="11" text-anchor="middle">NODE</text>
  <text x="670" y="185" fill="#22c55e" font-family="monospace" font-size="22" font-weight="bold" text-anchor="middle">>= 18</text>

  <!-- Changes section -->
  <text x="40" y="240" fill="#a5b4fc" font-family="monospace" font-size="12" font-weight="bold">CHANGES SHIPPED</text>
  <line x1="40" y1="250" x2="760" y2="250" stroke="#2d2d5e" stroke-width="1"/>

${changes.map((c, i) => `  <circle cx="55" cy="${273 + i * 28}" r="4" fill="#22c55e"/>
  <text x="70" y="${278 + i * 28}" fill="#e2e8f0" font-family="monospace" font-size="13">${c}</text>`).join('\n')}

  <!-- Footer -->
  <line x1="40" y1="480" x2="760" y2="480" stroke="#2d2d5e" stroke-width="1"/>
  <text x="40" y="505" fill="#64748b" font-family="monospace" font-size="11">github.com/naimkatiman/continuous-improvement</text>
  <text x="760" y="505" fill="#6366f1" font-family="monospace" font-size="11" text-anchor="end">#BuildInPublic</text>
</svg>`;

const outPath = join(__dirname, `update-${today}.svg`);
writeFileSync(outPath, svg);
console.log(`Generated: ${outPath}`);
