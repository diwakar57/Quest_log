# Graph Report - Quest_log  (2026-09-03)

## Corpus Check
- 40 files · ~30,526 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 257 nodes · 393 edges · 22 communities (16 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- package.json
- .oxlintrc.json
- Execution Workflow — Task 1 to Task 15
- Quest Log — Build Tasks for Claude Code
- What You Must Do When Invoked
- devDependencies
- Today
- graphify reference: extra exports and benchmark
- graphify reference: query, path, explain
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- App.jsx
- React + Vite
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- CLAUDE.md
- .claude/CLAUDE.md
- extraction-spec.md
- achievementLogic.js
- Today.jsx

## God Nodes (most connected - your core abstractions)
1. `Today()` - 19 edges
2. `Execution Workflow — Task 1 to Task 15` - 18 edges
3. `Quest Log — Build Tasks for Claude Code` - 16 edges
4. `todayISODate()` - 14 edges
5. `What You Must Do When Invoked` - 12 edges
6. `supabase` - 10 edges
7. `/graphify` - 10 edges
8. `react` - 9 edges
9. `deriveQuests()` - 9 edges
10. `runAchievementCheck()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `hasPerfectWeek()` --calls--> `todayISODate()`  [EXTRACTED]
  src/lib/achievementLogic.js → src/lib/onboarding.js
- `checkAchievements()` --calls--> `todayISODate()`  [EXTRACTED]
  src/lib/achievementLogic.js → src/lib/onboarding.js
- `runAchievementCheck()` --calls--> `checkAchievements()`  [EXTRACTED]
  src/pages/Today.jsx → src/lib/achievementLogic.js
- `resetAllData()` --calls--> `todayISODate()`  [EXTRACTED]
  src/pages/Settings.jsx → src/lib/onboarding.js
- `Today()` --calls--> `todayISODate()`  [EXTRACTED]
  src/pages/Today.jsx → src/lib/onboarding.js

## Import Cycles
- None detected.

## Communities (22 total, 5 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.10
Nodes (19): dependencies, react, react-dom, recharts, @supabase/supabase-js, name, private, scripts (+11 more)

### Community 1 - ".oxlintrc.json"
Cohesion: 0.25
Nodes (7): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, warn

### Community 2 - "Execution Workflow — Task 1 to Task 15"
Cohesion: 0.11
Nodes (18): After Task 15, Before Task 1, Execution Workflow — Task 1 to Task 15, TASK 10 — 12-week grid, TASK 11 — Trial system, TASK 12 — Achievements, TASK 13 — Settings + polish, TASK 14 — PWA setup (+10 more)

### Community 3 - "Quest Log — Build Tasks for Claude Code"
Cohesion: 0.12
Nodes (16): Quest Log — Build Tasks for Claude Code, TASK 10 — 12-week grid, TASK 11 — Trial system, TASK 12 — Achievements, TASK 13 — Settings + polish, TASK 14 — PWA setup, TASK 15 — Deploy, TASK 1 — Project scaffold (+8 more)

### Community 4 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 5 - "devDependencies"
Cohesion: 0.11
Nodes (19): oxlint, devDependencies, oxlint, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, vite (+11 more)

### Community 6 - "Today"
Cohesion: 0.18
Nodes (17): computeMultiplier(), computeStreak(), formatUTCDate(), isDayComplete(), parseUTCDate(), meetsTarget(), Today(), addXp() (+9 more)

### Community 7 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 8 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 9 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 10 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 11 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 12 - "App.jsx"
Cohesion: 0.13
Nodes (19): react, App(), DebugDateBanner(), activeDebugDate(), DAYS, pickRunDay(), todayISODate(), supabase (+11 more)

### Community 14 - "React + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + Vite

### Community 20 - "achievementLogic.js"
Cohesion: 0.20
Nodes (15): achievements, checkAchievements(), checkCondition(), countRows(), countRunQuestsCompleted(), getBestStreak(), getCurrentTier(), hasPerfectWeek() (+7 more)

### Community 21 - "Today.jsx"
Cohesion: 0.16
Nodes (21): mealSidePools, restDayQuests, runProgression, trials, workoutPools, dailyHash(), daysSince(), getMealSideQuest() (+13 more)

## Knowledge Gaps
- **106 isolated node(s):** `$schema`, `oxc`, `react/rules-of-hooks`, `warn`, `name` (+101 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 133 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Today()` connect `Today` to `App.jsx`, `Today.jsx`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `react` connect `App.jsx` to `.oxlintrc.json`, `achievementLogic.js`, `Today.jsx`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `plugins` connect `.oxlintrc.json` to `App.jsx`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `$schema`, `oxc`, `react/rules-of-hooks` to the rest of the system?**
  _106 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Execution Workflow — Task 1 to Task 15` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `Quest Log — Build Tasks for Claude Code` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._