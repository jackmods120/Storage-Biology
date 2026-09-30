# Storage server (Vercel + Cloudflare R2)

The app posts videos / audio / pictures itself. Nothing is stored as a public file in this project.

Flow: app -> `POST /api/sign` (with the Firebase login token) -> server checks you are the admin
-> gives a one-hour upload address -> the app sends the file straight to R2 -> post saved in Firestore.

## 1) Cloudflare R2
1. R2 -> Create bucket (e.g. `media`).
2. Bucket -> Settings -> Public access -> enable the `r2.dev` address (copy it).
3. R2 -> Manage API tokens -> Create token (Object Read & Write, this bucket) -> copy Access Key ID + Secret.

## 2) Vercel -> Settings -> Environment Variables
| Name | Value |
|---|---|
| R2_ACCOUNT_ID | Cloudflare account id |
| R2_ACCESS_KEY_ID | from the token |
| R2_SECRET_ACCESS_KEY | from the token |
| R2_BUCKET | media |
| R2_PUBLIC_URL | https://pub-xxxx.r2.dev |
| FIREBASE_API_KEY | same value as FB_KEY in MainActivity.java |
| ADMIN_EMAIL | same value as ADMIN_EMAIL in MainActivity.java |
| TELEGRAM_BOT_TOKEN | optional - NEW token from BotFather |
| TELEGRAM_CHANNEL_ID | optional - -100... |

Redeploy after adding them.

## API (all POST, header `Authorization: Bearer <Firebase idToken>`)
- `/api/sign`   {name, type, size} -> {uploadUrl, url, key, folder}   (max 5 GB per file)
- `/api/delete` {key}
- `/api/notify` {title, url}  (optional Telegram message)
