# App store listing (draft)

**Name:** Lingua: Learn Languages
**Subtitle (iOS, 30 chars):** Learn. Speak. Connect.
**Short description (Google Play, 80 chars):** Fun bite-size lessons, speaking practice with scores, and an AI tutor in 10 languages.

**Category:** Education
**Age rating:** 4+ / Everyone (re-check after you decide how the AI tutor is offered)

## Description

Learn Spanish, French, Japanese, German, Korean, Chinese, Italian, Hindi, Portuguese or Dutch in a few minutes a day.

- **Bite-size lessons:** match pairs, fill in the blank, build sentences, type answers and take dictation.
- **Speak with confidence:** say phrases out loud and get a pronunciation score, word by word.
- **Never forget:** spaced review brings words back right before you'd forget them.
- **Your own path:** take a placement test, then follow a map of units from Greetings to Hobbies.
- **Stay motivated:** daily quests, streaks with streak freezes, XP levels, badges and gentle daily reminders.
- **Talk it out:** role-play real situations with an AI tutor that corrects you kindly.
- **Made for everyone:** light and dark mode, adjustable text size and reduced motion.

## Keywords (iOS, 100 chars)

language,learn spanish,french,japanese,korean,vocabulary,pronunciation,speaking,flashcards,tutor

## Screenshots

`store/screenshots/` has 1290 × 2796 images (iPhone 6.7", also accepted by Google Play). Suggested captions:

1. `01-home.png`: Learn a language in 5 minutes a day
2. `02-path.png`: Follow your own learning path
3. `03-match.png`: Fun, interactive exercises
4. `04-speak.png`: Get scored on your pronunciation
5. `05-review.png`: Remember words for good
6. `06-progress.png`: Earn badges and level up

## Before you submit

- [ ] Replace `com.example.lingua` in `app.json` with your own bundle ID / package name.
- [ ] Host `store/PRIVACY.md` at a public URL and add it to both stores.
- [ ] App Privacy (iOS) / Data safety (Play): declare microphone + speech recognition use, and the AI tutor if you ship it (user content sent to a third party).
- [ ] If the AI tutor ships, host `server/` somewhere public (with rate limits) and set `EXPO_PUBLIC_TUTOR_URL` for the build.
- [ ] Have native speakers review the course content (`node scripts/export-content.js`).
- [ ] Build: `eas build --profile production --platform all`, then `eas submit`.
