const axios = require('axios');
const { execSync } = require('child_process');
const path = require('path');

const PY_CRAWLER = path.join(__dirname, 'webCrawler.py');

class WebSearchService {
  constructor() {
    this.duckApi = 'https://api.duckduckgo.com';
    this.stackApi = 'https://api.stackexchange.com/2.3';
    this.wikiApi = 'https://en.wikipedia.org/api/rest_v1';
  }

  isCodingQuestion(query) {
    const coding = /(code|program(?:ming)?|function|class|method|syntax|compile|debug|algorithm|java|python|javascript|typescript|react|node(?:\s*\.\s*js)?|sql|html|css|implement(?:ation)?|build|create|develop(?:er|ment)?|script|loop|array|string|variable|\bapi\b|database|print|write|error|bug|fix|install|config|deploy|npm|git|docker)/i;
    return coding.test(query);
  }

  isKnowledgeQuestion(query) {
    const knowledge = /(what is|who is|when did|where is|how does|define|meaning|history|capital|population|president|country|planet|scientist|inventor|discovery|theory|explain)/i;
    return knowledge.test(query);
  }

  async searchDuckDuckGo(query) {
    try {
      const { data } = await axios.get(`${this.duckApi}/`, {
        params: { q: query, format: 'json', no_html: 1, skip_disambig: 1 },
        timeout: 8000
      });
      if (data.AbstractText) {
        const source = data.AbstractSource ? `(Source: ${data.AbstractSource})` : '';
        return `${data.AbstractText}\n\n${source}\nRead more: ${data.AbstractURL || ''}`.trim();
      }
      if (data.RelatedTopics?.length > 0) {
        const topics = data.RelatedTopics.slice(0, 3).map(t => {
          if (t.Text) return `• ${t.Text}`;
          if (t.Topics) return t.Topics.slice(0, 2).map(s => `• ${s.Text}`).join('\n');
          return '';
        }).filter(Boolean).join('\n');
        if (topics) return topics;
      }
      if (data.Answer) return data.Answer;
      return null;
    } catch {
      return null;
    }
  }

  async searchStackOverflow(query) {
    try {
      const { data } = await axios.get(`${this.stackApi}/search/excerpts`, {
        params: {
          order: 'desc',
          sort: 'votes',
          q: query,
          accepted: true,
          pagesize: 5,
          site: 'stackoverflow',
          filter: 'withbody'
        },
        timeout: 8000
      });

      if (!data.items?.length) return null;

      const topItem = data.items[0];
      const topUrl = `https://stackoverflow.com/questions/${topItem.question_id}`;

      // Try deep crawl of the top result with Python ML extractor
      let deepContent = '';
      try {
        const stdout = execSync(`python3 "${PY_CRAWLER}" extract "${topUrl}"`, {
          timeout: 20000, maxBuffer: 1024 * 1024
        });
        const parsed = JSON.parse(stdout.toString());
        if (parsed.text && parsed.text.length > 200) {
          deepContent = parsed.summary || parsed.text.slice(0, 800);
        }
      } catch {}

      const parts = data.items.slice(0, 3).map((item, i) => {
        const body = item.body
          ? item.body.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 300)
          : '';
        const link = `https://stackoverflow.com/questions/${item.question_id}`;
        const votes = item.score;
        return `${i + 1}. ${item.title}\n   ${body}...\n   Votes: ${votes} | ${link}`;
      }).join('\n\n');

      if (deepContent) {
        return `Top answer from Stack Overflow:\n${deepContent}\n\n---\nMore results:\n\n${parts}`;
      }
      return parts;
    } catch {
      return null;
    }
  }

  async searchWikipedia(query) {
    try {
      const searchRes = await axios.get(`${this.wikiApi}/search/page`, {
        params: { q: query, limit: 1 },
        timeout: 5000
      });
      if (!searchRes.data.pages?.length) return null;

      const pageId = searchRes.data.pages[0].id;
      const { data: page } = await axios.get(`${this.wikiApi}/page/summary/${pageId}`, {
        timeout: 5000
      });

      if (page.extract) {
        const excerpt = page.extract.replace(/\s+/g, ' ').trim().slice(0, 500);
        return `${excerpt}\n\nSource: Wikipedia — ${page.content_urls?.desktop?.page || ''}`.trim();
      }
      return null;
    } catch {
      return null;
    }
  }

  async crawlUrl(url) {
    try {
      const stdout = execSync(`python3 "${PY_CRAWLER}" extract "${url.replace(/"/g, '\\"')}"`, {
        timeout: 20000, maxBuffer: 1024 * 1024
      });
      const data = JSON.parse(stdout.toString());
      if (data.text && data.text.length > 100) {
        return { title: data.title || '', text: data.text.slice(0, 2000), summary: data.summary || '' };
      }
      return null;
    } catch {
      return null;
    }
  }

  async searchGeneral(query) {
    const results = [];

    const ddg = await this.searchDuckDuckGo(query);
    if (ddg) results.push(`[DuckDuckGo]\n${ddg}`);

    const wiki = await this.searchWikipedia(query);
    if (wiki) results.push(`[Wikipedia]\n${wiki}`);

    if (results.length === 0) return null;
    return results.join('\n\n---\n\n');
  }

  async search(query) {
    const isCode = this.isCodingQuestion(query);

    if (isCode) {
      const soResult = await this.searchStackOverflow(query);
      if (soResult) {
        // Only return deep-crawl content (actual answer text), skip raw search listings
        if (soResult.startsWith('Top answer from Stack Overflow:')) {
          const answerMatch = soResult.match(/^Top answer from Stack Overflow:\n([\s\S]*?)\n\n---/);
          const cleanAnswer = answerMatch ? answerMatch[1].trim() : soResult;
          return cleanAnswer;
        }
        // No deep content — return null so caller falls through to canned responses
        return null;
      }
    }

    const general = await this.searchGeneral(query);
    if (general) {
      return general;
    }

    return null;
  }
}

module.exports = new WebSearchService();

module.exports = new WebSearchService();
