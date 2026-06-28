#!/usr/bin/env python3
"""ML-powered web crawler for E-Folio AI.
Uses newspaper3k (NLP article extraction) + trafilatura + BeautifulSoup.

Usage:
  python3 webCrawler.py extract <url>     # Extract content from a URL
  python3 webCrawler.py batch <url1> <url2> ...  # Batch extract
"""

import sys
import json
import urllib.parse
from newspaper import Article, Config
from bs4 import BeautifulSoup
import requests
import trafilatura

USER_AGENT = 'Mozilla/5.0 (compatible; EFolioBot/1.0; +https://github.com/efolio)'

def extract_article(url, timeout=15):
    """Extract using newspaper3k (ML-powered NLP extraction)."""
    config = Config()
    config.browser_user_agent = USER_AGENT
    config.request_timeout = timeout
    config.memoize_articles = False

    article = Article(url, config=config)
    article.download()
    article.parse()
    article.nlp()

    return {
        'title': article.title or '',
        'authors': article.authors or [],
        'publish_date': str(article.publish_date) if article.publish_date else '',
        'text': article.text[:5000] if article.text else '',
        'summary': article.summary[:1000] if article.summary else '',
        'keywords': article.keywords or [],
        'source': 'newspaper3k'
    }

def extract_trafilatura(url, timeout=15):
    """Extract using trafilatura (fallback)."""
    try:
        downloaded = trafilatura.fetch_url(url)
        if downloaded:
            text = trafilatura.extract(downloaded, include_links=False, include_tables=False, output_format='txt')
            if text and len(text.strip()) > 100:
                return {
                    'title': '',
                    'text': text[:5000],
                    'source': 'trafilatura'
                }
    except Exception:
        pass
    return None

def extract_soup(url, timeout=15):
    """Last-resort extraction with BeautifulSoup."""
    try:
        resp = requests.get(url, headers={'User-Agent': USER_AGENT}, timeout=timeout)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'lxml')
        for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'form', 'iframe']):
            tag.decompose()
        text = soup.get_text(separator='\n', strip=True)
        text = '\n'.join(line for line in text.split('\n') if len(line) > 40)
        return {
            'title': soup.title.string.strip() if soup.title and soup.title.string else '',
            'text': text[:5000],
            'source': 'beautifulsoup'
        }
    except Exception as e:
        return {'error': str(e)}

def extract(url):
    """Try extractors in order of quality."""
    try:
        return extract_article(url)
    except Exception:
        pass
    try:
        result = extract_trafilatura(url)
        if result:
            return result
    except Exception:
        pass
    return extract_soup(url)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Usage: webCrawler.py extract <url> | batch <url1> <url2> ...'}))
        sys.exit(1)

    mode = sys.argv[1]
    urls = sys.argv[2:]

    if mode == 'extract':
        result = extract(urls[0])
        print(json.dumps(result))
    elif mode == 'batch':
        results = []
        for url in urls:
            try:
                results.append(extract(url))
            except Exception as e:
                results.append({'url': url, 'error': str(e)})
        print(json.dumps(results))
    else:
        print(json.dumps({'error': f'Unknown mode: {mode}'}))
