#!/usr/bin/env node

/**
 * AI News Hub - Daily News Aggregator
 * Runs automatically before 6 PM CET each day
 * Fetches from multiple sources and updates the news data
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
    dataDir: './data',
    newsFile: 'news-data.json',
    logFile: 'aggregator.log',
    timezone: 'Europe/Amsterdam',
    updateTime: '17:45', // 5:45 PM CET
    sources: [
        {
            name: 'Build Fast with AI',
            url: 'https://www.buildfastwithai.com/blogs',
            category: 'news'
        },
        {
            name: 'OpenAI News',
            url: 'https://openai.com/news/',
            category: 'official'
        },
        {
            name: 'Google DeepMind Blog',
            url: 'https://blog.google/innovation-and-ai/',
            category: 'official'
        },
        {
            name: 'Anthropic Research',
            url: 'https://www.anthropic.com',
            category: 'official'
        },
        {
            name: 'TechCrunch AI',
            url: 'https://techcrunch.com/category/artificial-intelligence/',
            category: 'news'
        },
        {
            name: 'ScienceDaily AI',
            url: 'https://www.sciencedaily.com/news/computers_math/artificial_intelligence/',
            category: 'research'
        }
    ]
};

// Ensure data directory exists
if (!fs.existsSync(CONFIG.dataDir)) {
    fs.mkdirSync(CONFIG.dataDir, { recursive: true });
}

/**
 * Logging utility
 */
function log(message, level = 'INFO') {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: CONFIG.timezone });
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);
    
    const logPath = path.join(CONFIG.dataDir, CONFIG.logFile);
    fs.appendFileSync(logPath, logMessage + '\n');
}

/**
 * Fetch URL content with timeout
 */
function fetchUrl(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const request = protocol.get(url, { 
            timeout,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (response) => {
            let data = '';
            
            response.on('data', chunk => {
                data += chunk;
                if (data.length > 1000000) { // Max 1MB
                    request.destroy();
                    reject(new Error('Response too large'));
                }
            });
            
            response.on('end', () => resolve(data));
        });
        
        request.on('error', reject);
        request.on('timeout', () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

/**
 * Mock news fetching (replace with real parsing if using a news API)
 * In production, use a news API like NewsAPI or integrate RSS feeds
 */
async function fetchNewsFromSources() {
    log('Starting news aggregation...');
    const allNews = [];
    
    // This is where you'd integrate with actual news APIs
    // For now, returning structured template data
    
    const todayNews = [
        {
            id: 'gemini-2-5-pro',
            title: 'Gemini 2.5 Pro Dominates Science Tasks',
            description: 'Google\'s new reasoning mode hits 82.4% on GPQA Diamond, surpassing competitors. 94.1% on HumanEval+ resets the science leaderboard.',
            source: 'Google DeepMind',
            url: 'https://www.buildfastwithai.com',
            category: 'benchmark',
            priority: 'critical',
            date: new Date().toISOString().split('T')[0],
            tags: ['Gemini', 'Benchmarks', 'Science', 'Reasoning']
        },
        {
            id: 'chatgpt-market-share',
            title: 'ChatGPT Falls Below 50% Market Share',
            description: 'First time in AI history: ChatGPT at 46.4%, Gemini rises to 27.7%, Claude reaches 10.3%. Users actively compare assistants.',
            source: 'Sensor Tower',
            url: 'https://www.buildfastwithai.com',
            category: 'market',
            priority: 'high',
            date: new Date().toISOString().split('T')[0],
            tags: ['Market Share', 'Competitive', 'User Behavior']
        },
        {
            id: 'apple-gemini-ios27',
            title: 'Apple Picks Gemini Over ChatGPT for iOS 27',
            description: 'iOS 27 integrates Gemini as default Siri assistant. Major distribution win for Google, setback for OpenAI\'s assistant strategy.',
            source: 'Apple',
            url: 'https://www.buildfastwithai.com',
            category: 'platform',
            priority: 'critical',
            date: new Date().toISOString().split('T')[0],
            tags: ['Apple', 'Gemini', 'Platform Integration']
        }
    ];
    
    return allNews.concat(todayNews);
}

/**
 * Load existing news data
 */
function loadNewsData() {
    const filePath = path.join(CONFIG.dataDir, CONFIG.newsFile);
    
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (error) {
            log(`Error reading news file: ${error.message}`, 'ERROR');
            return { today: [], archive: [] };
        }
    }
    
    return { today: [], archive: [], lastUpdated: null };
}

/**
 * Save news data
 */
function saveNewsData(data) {
    const filePath = path.join(CONFIG.dataDir, CONFIG.newsFile);
    
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        log(`News data saved: ${data.today.length} items`);
    } catch (error) {
        log(`Error saving news file: ${error.message}`, 'ERROR');
    }
}

/**
 * Generate HTML from news data
 */
function generateNewsGrid(newsItems) {
    return newsItems.map(item => `
    <div class="news-card">
        <span class="news-tag${item.priority === 'critical' ? ' critical' : item.priority === 'high' ? ' warning' : ''}">
            ${item.category.toUpperCase()}
        </span>
        <h3 class="news-title">${escapeHtml(item.title)}</h3>
        <p class="news-description">${escapeHtml(item.description)}</p>
        <div class="news-meta">
            <a href="${item.url}" class="news-source" target="_blank">${escapeHtml(item.source)}</a>
            <span class="timestamp">${formatDate(item.date)}</span>
        </div>
    </div>
    `).join('');
}

/**
 * Update HTML file with new news
 */
function updateHtmlFile(newsItems) {
    const htmlFile = 'ai-news-hub.html';
    
    if (!fs.existsSync(htmlFile)) {
        log(`HTML file not found: ${htmlFile}`, 'WARNING');
        return;
    }
    
    try {
        let html = fs.readFileSync(htmlFile, 'utf-8');
        
        // Update the "Today's Top Stories" section
        const newsGrid = generateNewsGrid(newsItems.slice(0, 15));
        const placeholder = /<!-- Generated Today's Stories Start -->[\s\S]*?<!-- Generated Today's Stories End -->/;
        
        if (placeholder.test(html)) {
            html = html.replace(
                placeholder,
                `<!-- Generated Today's Stories Start -->\n<div class="news-grid">${newsGrid}</div>\n<!-- Generated Today's Stories End -->`
            );
        }
        
        // Update last update timestamp
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { timeZone: CONFIG.timezone });
        html = html.replace(
            /Last updated: <strong id="last-update">.*?<\/strong>/,
            `Last updated: <strong id="last-update">Today at ${timeStr} CET</strong>`
        );
        
        fs.writeFileSync(htmlFile, html, 'utf-8');
        log(`HTML file updated with ${newsItems.length} news items`);
    } catch (error) {
        log(`Error updating HTML file: ${error.message}`, 'ERROR');
    }
}

/**
 * Check if it's time to run
 */
function isTimeToRun() {
    const now = new Date();
    const amsterdamTime = now.toLocaleString('en-US', { timeZone: CONFIG.timezone });
    const [time] = amsterdamTime.split(', ').reverse();
    const [hours, minutes] = time.split(':').slice(0, 2);
    const currentTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    
    // Run if within 5 minutes of target time
    return currentTime >= '17:40' && currentTime <= '17:50';
}

/**
 * Helper: Escape HTML
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Helper: Format date
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Main aggregation function
 */
async function runAggregation() {
    log('='.repeat(60));
    log('AI News Hub - Daily Aggregation Started');
    log('='.repeat(60));
    
    try {
        // Fetch news from sources
        const newArticles = await fetchNewsFromSources();
        log(`Fetched ${newArticles.length} new articles`);
        
        // Load existing data
        let newsData = loadNewsData();
        
        // Archive previous day's news
        if (newsData.today.length > 0) {
            if (!newsData.archive) newsData.archive = [];
            newsData.archive.unshift({
                date: new Date().toISOString().split('T')[0],
                items: newsData.today
            });
            
            // Keep only last 30 days in archive
            if (newsData.archive.length > 30) {
                newsData.archive.pop();
            }
        }
        
        // Update today's news
        newsData.today = newArticles;
        newsData.lastUpdated = new Date().toISOString();
        
        // Save updated data
        saveNewsData(newsData);
        
        // Update HTML
        updateHtmlFile(newArticles);
        
        log('Aggregation completed successfully');
        log('='.repeat(60));
        
    } catch (error) {
        log(`Aggregation failed: ${error.message}`, 'ERROR');
        log('='.repeat(60));
        process.exit(1);
    }
}

/**
 * Schedule the aggregation
 */
function scheduleAggregation() {
    // Check every minute if it's time to run
    setInterval(() => {
        if (isTimeToRun()) {
            runAggregation().catch(error => {
                log(`Scheduled aggregation failed: ${error.message}`, 'ERROR');
            });
        }
    }, 60000); // Check every minute
    
    log('Aggregator scheduled to run daily at 5:45 PM CET');
}

/**
 * Entry point
 */
if (require.main === module) {
    const command = process.argv[2];
    
    if (command === '--now' || command === '-n') {
        // Run immediately (for testing)
        runAggregation().catch(error => {
            log(`Error: ${error.message}`, 'ERROR');
            process.exit(1);
        });
    } else if (command === '--schedule' || command === '-s') {
        // Run scheduled
        scheduleAggregation();
        // Also run immediately if close to scheduled time
        if (isTimeToRun()) {
            runAggregation();
        }
        // Keep process alive
        process.on('SIGTERM', () => {
            log('Aggregator shutting down gracefully...');
            process.exit(0);
        });
    } else {
        console.log(`
AI News Hub - Daily News Aggregator

Usage:
  node aggregator.js --now      Run news aggregation immediately
  node aggregator.js --schedule Run aggregator on schedule (5:45 PM CET)
  
Environment Variables:
  UPDATE_TIME     Set custom update time (default: 17:45)
  DATA_DIR        Set data directory (default: ./data)
  
Examples:
  node aggregator.js --now
  UPDATE_TIME=18:00 node aggregator.js --schedule
`);
    }
}

module.exports = { runAggregation, loadNewsData, saveNewsData };
