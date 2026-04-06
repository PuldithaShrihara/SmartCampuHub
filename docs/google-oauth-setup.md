# Google Sign-In (student login)

Student login supports **Sign in with Google** using the same Web OAuth client ID on the frontend and backend. The frontend obtains a Google **ID token** (JWT) and sends it to `POST /api/auth/student/google`; the backend verifies it with Google and issues your normal app JWT (`AuthResponse`).

## Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) and select or create a project.
2. **APIs & Services** → **OAuth consent screen**: configure the app (External is fine for testing; add test users if in Testing mode).
3. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**.
4. Application type: **Web application**.
5. **Authorized JavaScript origins** (required for the Sign in with Google button). The origin must match **exactly** what appears in the browser address bar (scheme + host + port). No path, no trailing slash.
   - **Local dev (this repo):** `http://localhost:5173` — Vite is configured to use this port only (`strictPort: true` in [`vite.config.js`](../frontend/vite.config.js)). If `npm run dev` says the port is in use, stop other Vite/Node processes and try again.
   - **Production:** your real site origin (e.g. `https://yourdomain.com`).
6. **Authorized redirect URIs**: Not used by the GIS credential flow in this app; you may leave empty or add a placeholder if the console requires it.
7. Copy the **Client ID** (looks like `….apps.googleusercontent.com`). Configure it on the **backend** (below). The SPA loads it automatically via `GET /api/auth/public/oauth-config` so you usually do **not** need a separate frontend env file.

## Configuration

### Backend (Spring Boot) — primary

Set the Web client ID in one of these ways:

| Variable / property | Description |
|---------------------|-------------|
| `GOOGLE_OAUTH_CLIENT_ID` | Environment variable; maps to `app.google.oauth.client-id`. |
| `app.google.oauth.client-id` | In `application.properties` or `application-local.properties`. |

| Optional | Description |
|----------|-------------|
| `GOOGLE_OAUTH_ALLOWED_EMAIL_DOMAINS` | Comma-separated allowed **email domains** (e.g. `myschool.edu`). Empty = any verified Google email. Maps to `app.google.oauth.allowed-email-domains`. |

Restart the backend after changing these values.

The frontend calls **`GET /api/auth/public/oauth-config`** (no JWT) to read `googleClientId`, then shows the Sign in with Google button when it is non-empty.

If the backend client ID is missing, `POST /api/auth/student/google` returns **503** and the login page shows setup instructions.

### Frontend (Vite) — optional override

| Variable | Description |
|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | If set, used instead of the backend public config (e.g. when the API base URL differs). Copy [`frontend/.env.example`](../frontend/.env.example) to `frontend/.env.local`. Restart Vite after changes. |

## Local quick check

1. Put your Web client ID in **`app.google.oauth.client-id`** (e.g. in `application-local.properties`) **or** set `GOOGLE_OAUTH_CLIENT_ID`.
2. Start MongoDB, run the backend on port **8081**, run the frontend (`npm run dev`).
3. Reload the student login page — the Google button should appear if the backend is up and the client ID is set.
4. Use **Sign in with Google** and pick a Google account.

The backend creates a **student** user on first Google sign-in (or links `googleSub` to an existing student by email).

## Troubleshooting: `Error 400: origin_mismatch`

Google shows this when the page URL’s **origin** is not listed under **Authorized JavaScript origins** for your OAuth **Web client**.

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Click your **OAuth 2.0 Client ID** (Web application).
3. Under **Authorized JavaScript origins**, click **Add URI** and enter the **exact** origin you use in the browser, for example:
   - `http://localhost:5173` for local development with this project’s Vite config.
4. **Save** and wait a minute, then try **Sign in with Google** again (hard refresh the app tab if needed).

If you previously opened the app on another port (e.g. `http://localhost:5178`), that origin must either be added in Google Console **or** you must use `http://localhost:5173` after freeing port 5173 and running `npm run dev` again.
