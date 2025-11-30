# GitHub Actions Setup for Ranking Refresh

## Quick Setup (2 minutes)

### Step 1: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Add these secrets:

   **Secret 1: APP_URL** (Required)
   - Click **New repository secret**
   - **Name:** `APP_URL`
   - **Secret:** Your app URL (e.g., `https://your-app.vercel.app`)
   - Click **Add secret**

   **Secret 2: RANKING_REFRESH_API_KEY** (Optional but Recommended)
   - Click **New repository secret** again
   - **Name:** `RANKING_REFRESH_API_KEY`
   - **Secret:** Generate a random string (e.g., use `openssl rand -hex 32`)
   - Click **Add secret**
   - Add the same value to your `.env.local` as `RANKING_REFRESH_API_KEY`

### Step 2: Verify Workflow File

The workflow file `.github/workflows/refresh-ranking.yml` is already created. It will:
- Run automatically every 10 minutes
- Refresh the explore ranking
- Log success/failure

### Step 3: Test It

1. Go to **Actions** tab in your repository
2. Click **Refresh Explore Ranking** workflow
3. Click **Run workflow** → **Run workflow** (manual trigger)
4. Wait for it to complete
5. Check the logs - you should see "✅ Ranking refreshed successfully"

## How It Works

- **Schedule:** Runs every 10 minutes (`*/10 * * * *`)
- **Manual Trigger:** You can run it manually from Actions tab
- **Calls:** `POST /api/admin/refresh-ranking` on your app
- **Free:** GitHub Actions provides 2,000 minutes/month free (plenty for this)

## Customizing Frequency

To change how often it runs, edit `.github/workflows/refresh-ranking.yml`:

```yaml
schedule:
  - cron: '*/5 * * * *'   # Every 5 minutes
  - cron: '*/15 * * * *'  # Every 15 minutes
  - cron: '0 * * * *'     # Every hour
```

## Troubleshooting

### "APP_URL secret is not set"
- Make sure you added the `APP_URL` secret in repository settings

### "Failed to refresh ranking (HTTP 401)"
- The API route requires authentication
- For MVP, you might want to make it public or use an API key
- Or update the workflow to include auth headers

### Workflow not running
- Check if GitHub Actions is enabled for your repository
- Go to **Settings** → **Actions** → **General**
- Make sure "Allow all actions and reusable workflows" is selected

## Monitoring

- View runs in **Actions** tab
- Each run shows logs and status
- Failed runs will be marked with ❌
- Successful runs show ✅

## Cost

GitHub Actions is **free** for:
- Public repositories: Unlimited minutes
- Private repositories: 2,000 minutes/month free

This workflow runs ~4,320 times/month (every 10 minutes), but each run takes < 1 second, so it uses minimal minutes.

