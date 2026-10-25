# Pocket AI — Groq-powered mobile chatbot

A small Expo React Native mobile app with a Node.js/Express backend. It answers simple questions using the Groq API.

## Features
- Chat-style mobile interface
- Loading indicator and error messages
- Clear chat button
- Backend keeps your Groq API key off the mobile device
- Configurable Groq model through an environment variable

## Requirements
- Node.js 18+
- Expo Go on your phone, or an Android emulator
- A Groq API key

## 1. Configure the backend
Open a terminal in `server/` and run:

```bash
npm install
```

Copy `.env.example` to `.env`, then put your key in `GROQ_API_KEY`.

```bash
# Windows PowerShell
Copy-Item .env.example .env
```

Edit `.env`:
```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
PORT=3000
```

If that model is unavailable for your account, change `GROQ_MODEL` to a model currently enabled in your Groq console.

Start the backend:
```bash
npm run dev
```

The API health check is available at `http://localhost:3000/health`.

## 2. Configure the mobile app
In `mobile/App.js`, set `API_BASE_URL` to the computer's LAN IP address, for example:

```js
const API_BASE_URL = "http://192.168.1.10:3000";
```

- Android emulator: use `http://10.0.2.2:3000`
- iOS simulator: usually `http://localhost:3000`
- Physical phone: use your computer's local Wi-Fi IP, and ensure both devices are on the same Wi-Fi network.
- Do not use `localhost` on a physical phone; it points to the phone itself.

In a terminal in `mobile/`, run:
```bash
npm install
npx expo start
```

Scan the QR code using Expo Go, or press `a` to open an Android emulator.

## API
`POST /api/chat`
```json
{
  "messages": [
    { "role": "user", "content": "Explain AI in simple words." }
  ]
}
```

Success response:
```json
{ "reply": "..." }
```

## Security notes
- Never put the Groq API key in `mobile/App.js` or any client-side code.
- `.env` is ignored by Git.
- For a public deployment, add authentication, rate limiting, request-size limits, and HTTPS.
