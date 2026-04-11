#!/usr/bin/env node

/**
 * Local social media automation for continuous-improvement.
 *
 * Setup:
 *   cp .env.example .env   # add your API keys
 *   node bin/social.mjs setup          # install daily cron job
 *
 * Manual usage:
 *   node bin/social.mjs post --platform x
 *   node bin/social.mjs post --platform linkedin
 *   node bin/social.mjs post --platform all
 *   node bin/social.mjs preview --platform x
 *   node bin/social.mjs uninstall                 # remove cron job
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import https from 'https';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// --- env loader (zero deps, no dotenv needed) ---
function loadEnv() {
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return {};
  const env = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    env[key] = val;
  }
  return env;
}

// --- OAuth 1.0a signing for X/Twitter ---
function oauthSign(method, url, params, consumerSecret, tokenSecret) {
  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.keys(params).sort().map(k => `${k}=${encodeURIComponent(params[k])}`).join('&')
  )}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
}

function buildOAuthHeader(method, url, body, env) {
  const oauthParams = {
    oauth_consumer_key: env.X_CONSUMER_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: env.X_ACCESS_TOKEN,
    oauth_version: '1.0',
  };

  const allParams = { ...oauthParams };
  const sig = oauthSign(method, url, allParams, env.X_CONSUMER_SECRET, env.X_ACCESS_TOKEN_SECRET);
  oauthParams.oauth_signature = sig;

  const header = 'OAuth ' + Object.keys(oauthParams).sort()
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
    .join(', ');
  return header;
}

// --- HTTP post helper (zero deps) ---
function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers,
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// --- content generation ---
function getVersion() {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  return pkg.version;
}

function getTestCount() {
  try {
    const readme = readFileSync(join(root, 'README.md'), 'utf8');
    const match = readme.match(/(\d+)\s+tests/);
    return match ? match[1] : '104';
  } catch { return '104'; }
}

function generateX(version, testCount) {
  const url = `https://github.com/naimkatiman/continuous-improvement`;
  return `The 7 Laws of AI Agent Discipline — v${version} just shipped.

Your AI agent says "Done!" but didn't test anything. These 7 laws fix that.

- ${testCount} tests, zero dependencies
- MCP server (beginner + expert modes)
- Works with Claude Code, Cursor, Codex, Gemini CLI
- Auto-leveling instinct learning

npx continuous-improvement install

${url}/releases/tag/v${version}

#ClaudeCode #AIAgent #OpenSource #BuildInPublic`;
}

function generateLinkedIn(version, testCount) {
  const url = `https://github.com/naimkatiman/continuous-improvement`;
  return `Shipped v${version} of "The 7 Laws of AI Agent Discipline" — an open-source framework that stops AI coding agents from skipping steps, guessing, and declaring "done" without verifying.

The problem: AI agents lie about completion. They skip research, create duplicate code, and break tests. Every developer using Claude Code, Cursor, or Codex has seen this.

The fix: 7 enforceable laws + an auto-leveling learning system called Mulahazah that builds instincts over time.

What's in v${version}:
- ${testCount} tests, zero npm dependencies
- MCP server with beginner/expert modes (up to 10 tools)
- CodeQL security scanning in CI
- Starter instinct packs for React, Python, Go
- GitHub Action transcript linter (compliance score 0-100)
- Works with Claude Code, Claude Desktop, Cursor, Zed, Windsurf, VS Code, Codex, Gemini CLI

Install in 10 seconds:
npx continuous-improvement install

${url}/releases/tag/v${version}

#AIAgent #ClaudeCode #DevTools #OpenSource #BuildInPublic #MCPServer #AIDiscipline`;
}

// --- posting ---
async function postToX(text, env) {
  const required = ['X_CONSUMER_KEY', 'X_CONSUMER_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_TOKEN_SECRET'];
  const missing = required.filter(k => !env[k]);
  if (missing.length) {
    console.error(`Missing in .env: ${missing.join(', ')}`);
    console.error('Get keys at: https://developer.x.com/en/portal/dashboard');
    process.exit(1);
  }

  const apiUrl = 'https://api.x.com/2/tweets';
  const body = JSON.stringify({ text });
  const auth = buildOAuthHeader('POST', apiUrl, body, env);

  const res = await httpsPost(apiUrl, {
    'Authorization': auth,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  }, body);

  console.log(`Posted to X: https://x.com/i/status/${res.body.data.id}`);
  return res;
}

async function postToLinkedIn(text, env) {
  if (!env.LINKEDIN_ACCESS_TOKEN || !env.LINKEDIN_PERSON_URN) {
    console.error('Missing in .env: LINKEDIN_ACCESS_TOKEN, LINKEDIN_PERSON_URN');
    console.error('Get token at: https://www.linkedin.com/developers/apps');
    process.exit(1);
  }

  const body = JSON.stringify({
    author: env.LINKEDIN_PERSON_URN,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  });

  const res = await httpsPost('https://api.linkedin.com/v2/ugcPosts', {
    'Authorization': `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
    'Content-Length': Buffer.byteLength(body),
  }, body);

  console.log('Posted to LinkedIn successfully.');
  return res;
}

// --- cron management ---
const CRON_TAG = '# continuous-improvement-social';
const SCRIPT_PATH = join(root, 'bin/social.mjs');

function setupCron(schedule = '0 10 * * *') {
  try {
    const existing = execSync('crontab -l 2>/dev/null', { encoding: 'utf8' });
    if (existing.includes(CRON_TAG)) {
      console.log('Cron job already installed. Use "uninstall" first to change schedule.');
      return;
    }
    const newCron = `${existing.trimEnd()}\n${schedule} cd ${root} && node ${SCRIPT_PATH} post --platform all ${CRON_TAG}\n`;
    execSync(`echo '${newCron.replace(/'/g, "'\\''")}' | crontab -`, { encoding: 'utf8' });
  } catch {
    const newCron = `${schedule} cd ${root} && node ${SCRIPT_PATH} post --platform all ${CRON_TAG}\n`;
    execSync(`echo '${newCron.replace(/'/g, "'\\''")}' | crontab -`, { encoding: 'utf8' });
  }
  console.log(`Cron installed: "${schedule}" — posts daily at 10:00 AM`);
  console.log(`Schedule: ${schedule}`);
  console.log(`Script: ${SCRIPT_PATH}`);
  console.log('Run "node bin/social.mjs uninstall" to remove.');
}

function uninstallCron() {
  try {
    const existing = execSync('crontab -l 2>/dev/null', { encoding: 'utf8' });
    const filtered = existing.split('\n').filter(l => !l.includes(CRON_TAG)).join('\n');
    execSync(`echo '${filtered.replace(/'/g, "'\\''")}' | crontab -`, { encoding: 'utf8' });
    console.log('Cron job removed.');
  } catch {
    console.log('No cron job found.');
  }
}

// --- main ---
const [command, ...rest] = process.argv.slice(2);
const platformIdx = rest.indexOf('--platform');
const platform = platformIdx !== -1 ? rest[platformIdx + 1] : 'all';
const scheduleIdx = rest.indexOf('--schedule');
const schedule = scheduleIdx !== -1 ? rest[scheduleIdx + 1] : '0 10 * * *';

const version = getVersion();
const testCount = getTestCount();
const generators = {
  x: () => generateX(version, testCount),
  linkedin: () => generateLinkedIn(version, testCount),
};

switch (command) {
  case 'preview': {
    if (platform === 'all') {
      for (const [name, fn] of Object.entries(generators)) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`PLATFORM: ${name.toUpperCase()}`);
        console.log(`${'='.repeat(60)}\n`);
        console.log(fn());
      }
    } else if (generators[platform]) {
      console.log(generators[platform]());
    } else {
      console.error(`Unknown platform: ${platform}`);
      process.exit(1);
    }
    break;
  }

  case 'post': {
    const env = loadEnv();
    const targets = platform === 'all' ? ['x', 'linkedin'] : [platform];

    for (const target of targets) {
      const text = generators[target]();
      try {
        if (target === 'x') await postToX(text, env);
        else if (target === 'linkedin') await postToLinkedIn(text, env);
        console.log(`[${target}] Done.`);
      } catch (err) {
        console.error(`[${target}] Failed: ${err.message}`);
      }
    }
    break;
  }

  case 'setup': {
    setupCron(schedule);
    break;
  }

  case 'uninstall': {
    uninstallCron();
    break;
  }

  default:
    console.log(`continuous-improvement social media automation

Usage:
  node bin/social.mjs preview  --platform x|linkedin|all    Preview post content
  node bin/social.mjs post     --platform x|linkedin|all    Post now
  node bin/social.mjs setup    [--schedule "0 10 * * *"]    Install daily cron
  node bin/social.mjs uninstall                             Remove cron job

Setup:
  1. cp .env.example .env
  2. Add your API keys to .env
  3. node bin/social.mjs setup
`);
}
