# Execution Workflow — Task 1 to Task 15

This is the actual sequence: what you paste to the agent, what you personally do in between, and what you check before moving on. Follow top to bottom.

---

### Before Task 1
Complete the 7 setup items from the previous message (Claude Code installed, local repo + git init, GitHub repo created, Supabase project created with URL/key ready, Vercel account created, weight unit decided, tasks read once).

---

### TASK 1 — Project scaffold
1. Open terminal inside your `quest-log` folder, start Claude Code there.
2. Paste Task 1's text.
3. When it finishes: run `npm run dev` yourself, confirm the styled Tailwind test page loads in the browser.
4. `git add . && git commit -m "scaffold"` yourself.
**You do:** verify it runs, commit.

---

### TASK 2 — Supabase schema
1. Paste Task 2's text.
2. Claude Code will output a `.sql` file in the repo — open it yourself.
3. Go to your Supabase project → SQL Editor → paste the contents → run it. **The agent cannot do this step — you must paste it into Supabase yourself.**
4. Confirm in Supabase's Table Editor that all 7 tables now exist.
5. Open the `.env` file Claude Code created in Task 1, paste in your real Supabase Project URL and anon key yourself (don't hand these to the agent in chat).
**You do:** run the SQL in Supabase dashboard, fill in `.env` with real keys.

---

### TASK 3 — Auth + onboarding
1. Paste Task 3's text, mentioning your chosen weight unit and protein default if you want to lock those in explicitly.
2. Once built: run the app, sign up with your own email, confirm the magic link email arrives (check Supabase Auth settings if it doesn't — email provider may need confirming in the dashboard).
3. Complete the onboarding form yourself as a test user.
4. Check Supabase Table Editor: confirm a row appeared in `users`, `tiers`, and `xp_stats`.
**You do:** test the signup flow yourself end to end, verify rows in Supabase.

---

### TASK 4 — Static content files
1. Paste Task 4's text.
2. Open each generated file yourself and skim it — this is game content, so read it for quality (does the tier 0 workout pool actually look beginner-appropriate? do the meal side-quests make sense?). Ask the agent to revise anything that looks off before moving on.
**You do:** review content quality, not just "did it run."

---

### TASK 5 — Quest generation logic
1. Paste Task 5's text.
2. Run `npm run test` yourself, confirm the tests pass.
**You do:** run the test command, confirm green.

---

### TASK 6 — Today screen
1. Paste Task 6's text.
2. Run the app, log in as your test user, confirm the Today page shows a quest.
3. Mark a quest complete, refresh the page, confirm it's still marked complete (this proves it's actually saving to Supabase, not just local state).
**You do:** manual click-through test, refresh to confirm persistence.

---

### TASK 7 — Streak and multiplier
1. Paste Task 7's text.
2. To actually test a streak, you'll need fake historical data: go into Supabase's Table Editor yourself and manually insert 3-4 `daily_logs` rows with past dates, marked complete, for your test user.
3. Reload the app, confirm the streak count and multiplier reflect those manually-inserted days correctly.
**You do:** manually seed test data in Supabase, verify the math.

---

### TASK 8 — Character screen
1. Paste Task 8's text.
2. Check the page reflects the XP your test-completions from Task 6/7 actually earned — do rough mental math (e.g. if you completed 3 quests worth ~20-25 XP each, total should be roughly in that range).
**You do:** sanity-check the numbers aren't obviously wrong.

---

### TASK 9 — Weight tracking
1. Paste Task 9's text.
2. Log a test weight, confirm it appears on the chart.
3. Add 2-3 more manually via Supabase Table Editor with different dates to see the trend line actually trend.
**You do:** seed a few weight entries to see the chart render meaningfully.

---

### TASK 10 — 12-week grid
1. Paste Task 10's text.
2. Since you've already got test `daily_logs` rows from Task 7, the grid should immediately show some filled/half boxes — confirm it matches what you seeded.
**You do:** cross-check the grid against your known test data.

---

### TASK 11 — Trial system
1. Paste Task 11's text.
2. To test without waiting 14 real days: manually edit `tier_started_at` in Supabase to a date 15 days ago for your test user.
3. Reload the app, confirm a Trial card appears.
4. Click "Clear it," confirm `current_tier` incremented in Supabase, and confirm the next day's generated quest (Task 5/6) now pulls from the new tier's pool.
**You do:** manually backdate a field to trigger the trial, verify the tier actually changes downstream behavior.

---

### TASK 12 — Achievements
1. Paste Task 12's text.
2. Trigger a condition you know should unlock something (e.g. complete a quest for the first time), confirm a toast appears and it shows up permanently on the Character page.
**You do:** trigger one achievement manually, confirm it doesn't duplicate on a second trigger of the same condition.

---

### TASK 13 — Settings + polish
1. Paste Task 13's text.
2. Resize your browser to phone width (or use dev tools device mode) and click through every screen yourself.
3. Test "Reset all data" on your test account only — not one you care about keeping.
**You do:** the mobile-width visual check, since this is subjective and the agent can't fully judge it.

---

### TASK 14 — PWA setup
1. Paste Task 14's text.
2. Open the deployed or local site on your actual phone browser, use "Add to Home Screen," confirm it opens without browser UI.
**You do:** the real-device install test — this can't be verified from a desktop.

---

### TASK 15 — Deploy
1. Paste Task 15's text.
2. In the Vercel dashboard yourself: add the two Supabase env vars under Project Settings → Environment Variables (same values as your local `.env`).
3. Trigger a deploy, open the live URL, do the full flow one more time (sign up as a *new* second test account, onboard, complete a quest, refresh).
**You do:** set env vars in Vercel's dashboard, run the final live test yourself.

---

## After Task 15
Go back to Step 5 from the earlier plan: get 5-10 real beginners using the live link before building anything further. That feedback decides what Task 16+ should even be.
