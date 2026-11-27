# Lingua AI tutor server

Conversation practice in the app sends the role-play to this small server, which asks Claude (`claude-opus-5-5`) for the tutor's next line, a translation, a gentle correction of your last message, and reply suggestions. Your Anthropic API key stays here and never ships inside the app.

## Run it

```bash
cd server
npm install
# macOS / Linux
ANTHROPIC_API_KEY=sk-ant-... npm start
# Windows PowerShell
$env:ANTHROPIC_API_KEY="sk-ant-..."; npm start
```

It listens on port 8787 (set `PORT` to change it). Check it with `http://localhost:8787/health`.

## Point the app at it

- **Web app:** works automatically with `http://localhost:8787`.
- **Phone:** in the app, go to Settings → AI tutor server and enter `http://<your computer's IP>:8787`, with the phone on the same network. Or set `EXPO_PUBLIC_TUTOR_URL` before starting Expo or building.

## Notes

- Each tutor turn is one Claude request at low effort with structured JSON output. If the model declines a message, the server-side fallback (`fallbacks: "default"`) retries it on another model in the same call.
- Set `TUTOR_MODEL` to use a different Claude model.
- **Protect it before sharing it.** Set `TUTOR_TOKEN` to a long random string and the server rejects requests without `Authorization: Bearer <token>`. Enter the same token in the app under Settings → AI tutor server.
- Each client address gets up to 40 tutor turns per 10 minutes. Change this with `TUTOR_RATE_LIMIT`.
- For production, also host it behind HTTPS.
