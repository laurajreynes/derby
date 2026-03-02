# 🏇 The Ring Ring Derby

Phone Training Championship — Anderson Automotive Group, March 2026

## Deploy to Vercel (Easiest — 2 minutes)

1. Go to [vercel.com](https://vercel.com) and sign up for a free account
2. Go to [github.com](https://github.com) and create a new repository
3. Upload this project's files to that repository
4. Back in Vercel, click **"Add New Project"** → **Import** your GitHub repo
5. Click **Deploy** — that's it!

You'll get a URL like `ring-ring-derby.vercel.app`

## How It Works

- **Public view** (the URL): Everyone sees the race, standings, and how-to-score — read-only
- **Admin view** (URL + `#admin`): Liza adds `#admin` to the end of the URL to unlock the score editor

## Scoring

| Category | Points |
|----------|--------|
| 📞 Call Monitoring (2 diff people on call guide) | 3 pts |
| 🕵️ Mystery Shop | 1 pt |
| 🎯 Manager Ring Ring Session | 5 pts |

All entries submitted to Liza for scoring. Most points by March 31 wins!

## Note on Score Storage

Scores are saved in the browser's localStorage. This means:
- Scores persist between visits on the **same device/browser**
- Different devices won't share scores automatically

For shared scores across all viewers, you'd need a database backend (like Vercel KV or a Google Sheet integration).
