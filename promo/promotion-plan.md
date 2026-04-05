# Promotion Plan — continuous-improvement

## Blocker: Publish to npm

The `npx continuous-improvement install` command won't work until published.

```bash
npm login
npm publish
```

Verify after: `npx continuous-improvement install --help`

---

## Launch Sequence (recommended order)

### Day 0 — Prep
- [ ] Publish to npm
- [ ] Verify `npx continuous-improvement install` works end-to-end
- [ ] Create a 30-second screen recording: before/after agent behavior
- [ ] Create a simple diagram of the 7-rule loop (use excalidraw or similar)

### Day 1 — GitHub + X
- [ ] Post X thread (see x-thread.md)
- [ ] Share in relevant Discord servers (Claude Code, Cursor, AI coding communities)

### Day 2 — LinkedIn
- [ ] Post LinkedIn version (see linkedin-post.md)
- [ ] Engage with every comment for first 4 hours

### Day 3 — Reddit (r/ClaudeAI)
- [ ] Post r/ClaudeAI version (see reddit-posts.md)
- [ ] Engage with every comment

### Day 5 — Reddit (r/ChatGPTPro or r/LocalLLaMA)
- [ ] Post second Reddit version
- [ ] Cross-link to GitHub issues for feature requests

### Day 7 — Hacker News
- [ ] Submit Show HN (see hackernews.md)
- [ ] Post top comment immediately
- [ ] Be available to respond for 4-6 hours

---

## Amplification Tactics

1. **GitHub stars beget stars** — ask 5-10 dev friends to star it before launch
2. **Screen recording** — a 30s demo showing the before/after is worth more than any post
3. **Issue templates** — you already have test-report.yml, add a "feature request" template
4. **Discussions tab** — enable GitHub Discussions for community Q&A
5. **npm weekly downloads** — once published, the download count becomes social proof
6. **Cross-link everywhere** — every platform post should link to GitHub, npm badge in README

---

## Content to Create Later (Week 2+)

- Blog post: "How I tracked the 5 ways AI agents fail" (based on failure-taxonomy.md)
- YouTube: 5-min walkthrough of install + demo
- Dev.to / Hashnode article (repurpose the blog post)
- "Lessons from 100 stars" follow-up post if traction builds

---

## Metrics to Track

- GitHub stars and forks
- npm weekly downloads
- GitHub traffic (visitors, clones)
- Reddit post upvotes and comments
- X thread impressions and bookmarks
