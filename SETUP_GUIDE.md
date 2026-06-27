# 🚀 AI News Hub - Setup & Deployment Guide

## Overview

AI News Hub is a fully automated daily news aggregator that captures AI industry updates before 6 PM Amsterdam time and presents them through a modern, updateable webpage.

### What You Get
- **ai-news-hub.html** - Responsive, interactive webpage (standalone file)
- **aggregator.js** - Node.js script that runs daily news collection
- **news-data.json** - JSON database of daily news items
- Automatic updates every day at 5:45 PM CET

---

## Part 1: Local Setup (5 minutes)

### Step 1: Download Files
Save these files to a folder (e.g., `ai-news-hub/`):
```
ai-news-hub/
├── ai-news-hub.html        (the webpage)
├── aggregator.js           (automation script)
└── data/                   (auto-created)
    ├── news-data.json      (auto-created)
    └── aggregator.log      (auto-created)
```

### Step 2: Install Node.js
If you don't have Node.js installed:
- **macOS**: `brew install node`
- **Windows**: Download from https://nodejs.org (LTS version)
- **Linux**: `sudo apt install nodejs npm`

Verify: `node --version` (should be v16+)

### Step 3: Test Locally
```bash
cd ai-news-hub
node aggregator.js --now
```

You should see:
```
[timestamp] [INFO] Starting news aggregation...
[timestamp] [INFO] News data saved: 3 items
[timestamp] [INFO] HTML file updated with 3 news items
```

Then open `ai-news-hub.html` in your browser to see the live webpage.

---

## Part 2: Hosting (Choose One)

### Option A: GitHub Pages (FREE, Recommended for Beginners)

#### Steps:
1. **Create GitHub Account** (if you don't have one)
   - Go to https://github.com/signup

2. **Create a New Repository**
   - Name: `ai-news-hub` (or any name)
   - Make it **Public**
   - Click "Create repository"

3. **Upload Files**
   - Click "Add file" → "Upload files"
   - Drag and drop `ai-news-hub.html` into the repository
   - Commit with message "Initial commit"

4. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Source: main branch
   - Folder: / (root)
   - Save

5. **Your Site is Live!**
   - Visit: `https://<your-username>.github.io/ai-news-hub/`
   - Full URL: `https://yourusername.github.io/ai-news-hub/ai-news-hub.html`

**Note on Automation:** GitHub Pages hosts static files only, so you'll need to:
- Option 1: Manually run `aggregator.js` daily and push updated files
- Option 2: Use GitHub Actions (advanced) to run the script automatically
- Option 3: Use Option B or C below for automatic updates

---

### Option B: Vercel (FREE, Best for Automatic Updates)

Vercel automatically runs serverless functions and can host your site.

#### Steps:
1. **Connect GitHub**
   - Push your files to GitHub (see Option A)
   - Go to https://vercel.com/signup
   - Click "Sign in with GitHub" and authorize

2. **Import Project**
   - Click "New Project" 
   - Select your `ai-news-hub` repository
   - Click "Import"

3. **Environment Setup**
   - Add environment variables:
     - `UPDATE_TIME`: `17:45`
     - `TIMEZONE`: `Europe/Amsterdam`
   - Click "Deploy"

4. **Add Automated Daily Runs**
   - Create `.github/workflows/daily-update.yml`:

```yaml
name: Daily AI News Update

on:
  schedule:
    - cron: '45 15 * * *'  # 3:45 PM UTC = 5:45 PM CET (during summer)
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: node aggregator.js --now
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add -A
          git commit -m "Daily news update $(date)"
      - uses: ad-m/github-push-action@master
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

Your site will now update automatically every day!

---

### Option C: Netlify (FREE with Automation)

#### Steps:
1. **Connect GitHub** (see Option A to push files first)
   - Go to https://netlify.com
   - Click "Sign up with GitHub"
   - Authorize Netlify

2. **Deploy**
   - Click "New site from Git"
   - Select your repository
   - Set build command: `npm install` (leave empty if no build)
   - Deploy folder: `.`
   - Click "Deploy site"

3. **Your Site is Live!**
   - Netlify assigns a URL like `ai-news-hub-xyz.netlify.app`

4. **Add Daily Updates** (Optional Pro Feature)
   - Use Netlify Functions or connect to a scheduler service
   - For free, use GitHub Actions (see Option B's workflow file)

---

### Option D: Raspberry Pi / Home Server (Full Control)

If you want to run this on your own hardware:

#### Steps:
1. **Install Node.js on your device**
2. **Copy files to server**
3. **Run with PM2** (process manager):

```bash
npm install -g pm2
pm2 start aggregator.js --cron "45 15 * * *" --name "ai-news-aggregator"
pm2 startup
pm2 save
```

4. **Serve the HTML file**

Using **Python** (built-in):
```bash
python3 -m http.server 8000
```

Using **Node.js http-server**:
```bash
npm install -g http-server
http-server
```

Access at: `http://localhost:8000/ai-news-hub.html`
Or from another computer: `http://YOUR_IP_ADDRESS:8000/ai-news-hub.html`

---

## Part 3: Advanced - Adding Real News Sources

The `aggregator.js` currently returns mock data. To use real sources:

### Using NewsAPI (Recommended)
1. Go to https://newsapi.org
2. Sign up (free tier available)
3. Get your API key
4. Add to `aggregator.js`:

```javascript
async function fetchRealNews() {
    const apiKey = process.env.NEWS_API_KEY;
    const query = 'AI OR "artificial intelligence" OR ChatGPT OR Gemini';
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&apiKey=${apiKey}`;
    
    const response = await fetchUrl(url);
    const data = JSON.parse(response);
    return data.articles.map(article => ({
        id: article.url,
        title: article.title,
        description: article.description,
        source: article.source.name,
        url: article.url,
        category: classifyArticle(article.title),
        priority: calculatePriority(article.title),
        date: article.publishedAt.split('T')[0],
        tags: extractTags(article.title)
    }));
}
```

### Using RSS Feeds
Alternatively, add RSS feed parsing:

```bash
npm install rss-parser
```

```javascript
const Parser = require('rss-parser');
const parser = new Parser();

async function fetchFromRSS() {
    const feeds = [
        'https://techcrunch.com/feed/',
        'https://feeds.bloomberg.com/markets/technology.rss',
        // Add more AI news feeds
    ];
    
    // Parse each feed...
}
```

---

## Part 4: Customization

### Change Update Time
Edit `aggregator.js`:
```javascript
updateTime: '17:45', // Change to your preferred time (24h format)
```

### Change Styling
Edit `ai-news-hub.html` in the `<style>` section:
```css
--primary: #0f172a;      /* Background color */
--accent: #3b82f6;       /* Accent color (blue) */
--text-primary: #f1f5f9; /* Text color */
```

### Add Custom News Categories
Edit the tag colors in HTML and add your categories to `aggregator.js`:
```javascript
category: 'your-category', // Added to news items
```

### Custom Domain
If using Vercel/Netlify:
- Settings → Domains
- Add your custom domain (requires DNS setup)

---

## Part 5: Monitoring & Maintenance

### Check Aggregator Logs
```bash
tail -f data/aggregator.log
```

### Manual Daily Update
```bash
node aggregator.js --now
```

### View News Data
Open `data/news-data.json` to see stored articles

### Reset Data
```bash
rm data/news-data.json data/aggregator.log
```

---

## Troubleshooting

### Problem: "Cannot find module 'http'"
**Solution:** Make sure Node.js is installed correctly
```bash
node --version
```

### Problem: Updates aren't running
**Check:**
1. Is the time correct? (Check server timezone)
2. Run manually: `node aggregator.js --now`
3. Check logs: `cat data/aggregator.log`

### Problem: GitHub Actions not running
**Solution:**
1. Check workflow file is in `.github/workflows/`
2. Ensure cron time accounts for timezone (UTC not CET)
3. Go to Actions tab and manually trigger workflow

### Problem: Site not updating
**Solution:**
1. Is `aggregator.js` actually running?
2. Check `data/news-data.json` was modified
3. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
4. Check if news HTML update code is working

---

## Pro Tips

✅ **Set a Calendar Reminder** for 5:50 PM CET daily to check the site  
✅ **Enable Notifications** for GitHub/Vercel deployment status  
✅ **Backup Your Data** by syncing to cloud storage  
✅ **Monitor Performance** with your host's analytics  
✅ **Test Updates** on a staging URL before going live

---

## Quick Reference

| Task | Command |
|------|---------|
| Test aggregator | `node aggregator.js --now` |
| Schedule aggregator | `node aggregator.js --schedule` |
| View logs | `tail -f data/aggregator.log` |
| Deploy to GitHub | `git add . && git commit -m "update" && git push` |
| Check Node version | `node --version` |

---

## Support & Resources

- **Node.js Docs**: https://nodejs.org/docs/
- **GitHub Pages**: https://pages.github.com/
- **Vercel Docs**: https://vercel.com/docs
- **NewsAPI**: https://newsapi.org/docs
- **RSS Feeds List**: https://www.rss-board.org/

---

**Version 1.0** | Last updated: June 27, 2026
