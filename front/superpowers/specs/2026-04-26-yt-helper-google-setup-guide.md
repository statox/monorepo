# YouTube OAuth Setup Guide

Step-by-step walkthrough to get a working Google Cloud project with YouTube Data API access and OAuth credentials.

---

## Step 1: Create a Google account (if needed)

You need a Google account. Any existing Gmail account works fine.

---

## Step 2: Open Google Cloud Console

Go to: https://console.cloud.google.com

Sign in with your Google account. If this is your first time, you'll be asked to accept the terms of service — accept them.

---

## Step 3: Create a new project

1. In the top navigation bar, click the **project selector dropdown** (it shows "Select a project" or your current project name, next to the Google Cloud logo).
2. In the popup, click **"New Project"** (top right of the popup).
3. Fill in:
    - **Project name:** `yt-helper-poc` (or anything you like)
    - **Location:** leave as "No organization"
4. Click **"Create"**.
5. Wait a few seconds. A notification will appear — click **"Select project"** to switch to it.

---

## Step 4: Enable the YouTube Data API v3

1. In the left sidebar, click **"APIs & Services"** → **"Library"**.
    - Alternatively, go directly to: https://console.cloud.google.com/apis/library
2. In the search bar, type **"YouTube Data API v3"**.
3. Click the result named **"YouTube Data API v3"** (by Google Enterprises).
4. Click the blue **"Enable"** button.
5. Wait for it to enable. You'll land on the API's overview page.

---

## Step 5: Configure the OAuth consent screen

Before creating credentials, Google requires you to configure what users will see when they authorize your app.

1. In the left sidebar, click **"APIs & Services"** → **"OAuth consent screen"**.
2. Choose **"External"** as the user type (this allows any Google account to log in during testing).
3. Click **"Create"**.
4. Fill in the required fields on the **"App information"** screen:
    - **App name:** `YT Helper POC`
    - **User support email:** select your email from the dropdown
    - **Developer contact information** (bottom of page): enter your email
    - Leave everything else blank.
5. Click **"Save and Continue"**.
6. On the **"Scopes"** screen, click **"Save and Continue"** (no changes needed — the scope will be requested dynamically by the app).
7. On the **"Test users"** screen:
    - Click **"+ Add Users"**.
    - Enter your Google account email.
    - Click **"Add"**.
    - Click **"Save and Continue"**.
8. Review the summary and click **"Back to Dashboard"**.

> **Why test users?** While the app is in "Testing" publishing status, only explicitly listed test users can authorize it. This is fine for a POC.

---

## Step 6: Create OAuth 2.0 credentials

1. In the left sidebar, click **"APIs & Services"** → **"Credentials"**.
2. Click **"+ Create Credentials"** at the top → choose **"OAuth client ID"**.
3. In the **"Application type"** dropdown, select **"Web application"**.
4. Fill in:
    - **Name:** `YT Helper Web Client`
5. Under **"Authorized redirect URIs"**, click **"+ Add URI"** and add:
    ```
    https://localhost:5173/yt-helper
    ```
6. Click **"+ Add URI"** again and add your production URL if you have one:
    ```
    https://<your-github-username>.github.io/yt-helper
    ```
    (Skip this for now if you're only testing locally.)
7. Click **"Create"**.
8. A dialog appears with your credentials:
    - **Client ID** — you need this. It looks like `123456789-abc...apps.googleusercontent.com`.
    - **Client Secret** — ignore this. PKCE doesn't use a client secret.
9. Copy the **Client ID**.
10. Click **"OK"** to close the dialog.

---

## Step 7: Add the client ID to your env file

Open `front/env.local` and replace both placeholders with the values from Step 6:

```
PUBLIC_YOUTUBE_CLIENT_ID=123456789-abc...apps.googleusercontent.com
PUBLIC_YOUTUBE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

The client secret is visible in the credentials dialog (Step 6), or you can retrieve it anytime from "APIs & Services" → "Credentials" → click your client → copy "Client secret".

> **POC note:** The `PUBLIC_` prefix means this value will be embedded in the browser JS bundle. This is acceptable for a local POC but must not be shipped to production. In production, the token exchange must happen server-side so the secret never reaches the browser.

Save the file. Do **not** commit these values — `env.local` should already be in `.gitignore`.

---

## Step 8: Verify the dev server starts correctly

```bash
cd front
npm run dev
```

Open https://localhost:5173/yt-helper in your browser.

Expected: you see the page with a **"Connect to YouTube"** button.

---

## Step 9: Test the OAuth flow

1. Click **"Connect to YouTube"**.
2. You'll be redirected to Google's consent screen. You should see:
    - App name: `YT Helper POC`
    - Scope: `See your YouTube account`
3. Click **"Continue"** (or "Allow").
4. You'll be redirected back to `https://localhost:5173/yt-helper`.
5. The page should show your list of YouTube subscriptions.

---

## Troubleshooting

| Symptom                                                 | Likely cause                                                                       | Fix                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `redirect_uri_mismatch` error from Google               | The redirect URI in your credentials doesn't exactly match                         | Double-check Step 6 — URI must be `https://localhost:5173/yt-helper` exactly (no trailing slash)                                                       |
| `Access blocked: app not verified`                      | Your email isn't in the test users list                                            | Go back to Step 5 → "Test users" and add your email                                                                                                    |
| `invalid_client` error                                  | Wrong or missing client ID                                                         | Check `env.local` has the correct value and restart the dev server                                                                                     |
| Page shows error "OAuth flow interrupted"               | You refreshed the page mid-redirect                                                | Click "Connect to YouTube" again to restart the flow                                                                                                   |
| Empty subscription list                                 | Your YouTube account has no subscriptions, or API quota exceeded                   | Check https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas                                                                          |
| `Token exchange failed (400): client_secret is missing` | "Web application" type credentials require the client secret in the token exchange | Add `PUBLIC_YOUTUBE_CLIENT_SECRET` to `env.local` and restart the dev server                                                                           |
| `Token exchange failed (400)`                           | Client ID or secret mismatch                                                       | Ensure both `PUBLIC_YOUTUBE_CLIENT_ID` and `PUBLIC_YOUTUBE_CLIENT_SECRET` are set correctly and the dev server was restarted after editing `env.local` |
