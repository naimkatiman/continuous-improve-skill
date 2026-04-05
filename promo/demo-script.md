# 30-Second Before/After Demo Script

## Setup

```bash
# Install asciinema + agg
sudo apt install asciinema
cargo install --git https://github.com/asciinema/agg

# Or use npm svg-term for GIF without cargo:
npm i -g svg-term-cli
```

---

## BEFORE (15 seconds) — Raw agent, no discipline

### What to show

A Claude Code session where you ask it to add a feature and it immediately starts writing code — no research, no plan, no verification.

### Record it

```bash
asciinema rec before.cast -t "Before" --idle-time-limit 1
```

### Script (type these live)

```
$ claude

> Add a caching layer to this API server
```

Wait for the agent to respond. It should:
- Jump straight into writing code (no research step)
- Write 200+ lines at once (no "one thing at a time")
- Say "Done!" without running any tests (no verification)

**Kill recording after ~15s** with `Ctrl+D` or `exit`.

### If the agent behaves too well

Use a fresh project with no CLAUDE.md:

```bash
mkdir /tmp/demo-before && cd /tmp/demo-before
git init && echo '{"name":"demo"}' > package.json
echo 'const express = require("express"); const app = express(); app.get("/data", (req, res) => res.json({ok:1})); app.listen(3000);' > server.js
asciinema rec before.cast -t "Before" --idle-time-limit 1
claude
# Then ask: "Add a caching layer to this API"
```

---

## AFTER (15 seconds) — With continuous-improvement installed

### Record it

```bash
asciinema rec after.cast -t "After" --idle-time-limit 1
```

### Script (type these live)

```
$ npx continuous-improvement install
  ✓ Detected Claude Code
  ✓ Appended 7 Laws to CLAUDE.md
  ✓ Installed Mulahazah hooks
  ✓ Done

$ claude

> Add a caching layer to this API server
```

The agent should now respond with:
1. **Research** — "Let me check what caching exists..."
2. **Plan** — "I'll use node-cache, single-file change..."
3. **Anti-scope** — "Not adding Redis, not adding CDN..."
4. **Execute** — one small change
5. **Verify** — runs the server, tests the endpoint

**Kill recording after ~15s** with `Ctrl+D` or `exit`.

---

## Post-Production

### Convert to GIF

```bash
# Using agg (rust-based, high quality)
agg before.cast before.gif --cols 80 --rows 24 --speed 1.5
agg after.cast after.gif --cols 80 --rows 24 --speed 1.5
```

### Combine into side-by-side (for video)

```bash
# Stack horizontally (side by side)
ffmpeg -i before.gif -i after.gif -filter_complex "[0:v]pad=iw*2:ih[bg];[bg][1:v]overlay=w" sidebyside.mp4

# Or vertically (stacked, better for mobile)
ffmpeg -i before.gif -i after.gif -filter_complex "[0:v]pad=iw:ih*2[bg];[bg][1:v]overlay=0:h" stacked.mp4
```

### Add labels

```bash
# Add "BEFORE" and "AFTER" text overlays
ffmpeg -i sidebyside.mp4 -vf "\
drawtext=text='BEFORE':fontsize=36:fontcolor=red:x=w/4-text_w/2:y=10,\
drawtext=text='AFTER':fontsize=36:fontcolor=green:x=3*w/4-text_w/2:y=10" \
-c:a copy final.mp4
```

---

## Quick One-Liner (Windows Game Bar alternative)

If asciinema is too much setup:

```bash
# Just use script + scriptreplay (built into every Linux)
script -t 2>before.timing before.log
# do the demo...
exit
scriptreplay before.timing before.log  # replay at original speed
```

---

## What makes the demo hit

| Before | After |
|--------|-------|
| Agent writes 200 lines immediately | Agent researches first |
| No mention of what exists | "Checking existing code..." |
| Says "Done!" with no test | Runs verification before reporting |
| No plan, no anti-scope | Clear plan + anti-scope |
| Will repeat same mistake next time | Mulahazah learns the pattern |

## Platform-specific tips

- **X/Twitter**: GIF, max 15s each, no audio needed
- **LinkedIn**: MP4, add captions since autoplay is muted
- **Reddit**: GIF or direct video upload
- **HN**: Link to asciinema.org recording (devs love this)
- **YouTube**: Full MP4 with voiceover explaining what's happening
