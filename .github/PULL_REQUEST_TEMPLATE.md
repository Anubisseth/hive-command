<!--
Thanks for the PR! Keep this template — fill in the relevant sections and delete the rest.
Read CONTRIBUTING.md if you haven't.
-->

## What

<!-- One sentence: what does this change? -->

## Why

<!-- What problem does it solve / what does it enable? Link to issue if applicable. -->

Closes #

## How

<!-- Brief implementation summary. Anything tricky? Anything you considered and rejected? -->

## Screenshots / GIFs

<!-- For UI changes, drop screenshots or a quick screen-recording GIF. -->

## How to test

<!-- Step-by-step. -->

1.
2.
3.

## Checklist

- [ ] I ran `npm run lint` locally and there are no new errors
- [ ] I ran `npm run build` locally and it succeeds
- [ ] I tested the change manually in the dev server
- [ ] If I touched `api/ai.js` or `src/lib/llmClient.js`, the rate-limit + auth + error-redaction logic still works
- [ ] If I touched `src/components/3d/`, the office still renders without console errors
- [ ] If I changed env vars, I updated `SETUP.md` and `.env.example`
- [ ] I did NOT commit any real Airtable IDs, API keys, or venture names
- [ ] If this touches user-facing UI, I considered keyboard navigation + accessibility

## Out of scope / follow-ups

<!-- Anything you noticed but consciously didn't do here. -->
