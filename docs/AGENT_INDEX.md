# AI Agent File Index

**Quick reference guide to find the right guidelines for your AI coding assistant.**

---

## 📌 Quick Navigation

### I'm using...

#### Claude Code (Anthropic CLI)
→ Read: `.claude-code-guidelines.md`
→ Reference: `.agent.md`
→ Detailed: `docs/AGENT_GUIDELINES.md`

#### GitHub Copilot
→ Read: `.github/copilot-instructions.md`
→ Reference: `.agent.md`
→ Detailed: `docs/AGENT_GUIDELINES.md`

#### Cursor IDE
→ Read: `.cursor/rules.md`
→ Configure: Use custom instructions from `.cursor/rules.md`
→ Reference: `.agent.md`

#### Continue IDE Extension
→ Read: `.continue/config.json`
→ Slash commands: `/build`, `/test`, `/review`
→ Reference: `.agent.md`

#### AutoGPT or other LLM agents
→ Read: `.agent.md` (universal guidelines)
→ Detailed: `docs/AGENT_GUIDELINES.md`
→ Patterns: `lib/` folder (examples)

---

## 📂 File Structure & Purpose

```
imageLingo/
├── .agent.md                          # ⭐ START HERE (All agents)
│
├── .claude-code-guidelines.md         # Claude Code specific
│
├── .github/
│   └── copilot-instructions.md       # GitHub Copilot specific
│
├── .cursor/
│   └── rules.md                      # Cursor IDE specific
│
├── .continue/
│   └── config.json                   # Continue IDE config
│
├── docs/
│   ├── AGENT_GUIDELINES.md           # Comprehensive guide
│   ├── AGENT_INDEX.md                # This file
│   ├── PR_CHECKLIST.md               # Pre-PR checklist
│   └── ...
│
└── ...other files
```

---

## 📖 What Each File Contains

### `.agent.md` (Universal - START HERE)
- ✅ Quick overview (everyone should read this)
- ✅ Core principles
- ✅ Mandatory workflow (lint → tsc → test)
- ✅ Code standards (TypeScript, React, API)
- ✅ Testing patterns
- ✅ Things never to do

**Read time**: 10 minutes
**Applies to**: All AI agents

---

### `.claude-code-guidelines.md`
- ✅ Claude Code specific
- ✅ PR submission workflow
- ✅ Forbidden actions
- ✅ Test requirements
- ✅ Commit message format

**Applies to**: Claude Code users only

---

### `.github/copilot-instructions.md`
- ✅ GitHub Copilot specific
- ✅ Quality checks
- ✅ Code standards
- ✅ Key architecture patterns

**Applies to**: GitHub Copilot users

---

### `.cursor/rules.md`
- ✅ Cursor IDE specific
- ✅ Core rules for code acceptance
- ✅ Best practices with Composer
- ✅ Custom instructions

**Applies to**: Cursor IDE users

---

### `.continue/config.json`
- ✅ Continue IDE configuration
- ✅ Slash commands
- ✅ System prompt
- ✅ Rules and enforcement

**Applies to**: Continue IDE users

---

### `docs/AGENT_GUIDELINES.md`
- ✅ Comprehensive reference
- ✅ Complete workflow
- ✅ All code standards
- ✅ Testing strategy
- ✅ Architecture patterns
- ✅ Security guidelines
- ✅ Troubleshooting

**Applies to**: All agents (detailed reference)

---

## 🎯 Reading Recommendations

### First-Time Contributor
1. Read: `.agent.md` (10 min)
2. Read: `docs/AGENT_GUIDELINES.md` sections 1-2 (10 min)
3. Clone and run: Quality checks
4. Start coding!

### Regular Contributor
1. Skim: `.agent.md` (reminder)
2. Reference: `docs/AGENT_GUIDELINES.md` as needed
3. Run: `npm run lint && npx tsc --noEmit && npm test`

---

## ⚡ Quick Checklist

Before every commit/push:

```bash
# Run all three quality checks
npm run lint              # ✅ 0 errors required
npx tsc --noEmit         # ✅ 0 errors required
npm test                 # ✅ All tests passing

# If all pass:
git add .
git commit -m "type: description"
git push origin feature-branch
```

---

**Last Updated: 2025-12-29**
**For all AI agents working on imageLingo**
