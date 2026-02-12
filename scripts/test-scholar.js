const cheerio = require('cheerio');
// Use global fetch (Node 18+)

async function fetchScholar(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Common selector for citations table
        // The structure is usually <td class="gsc_rsb_std">NUMBER</td>
        // The first one is "All" citations
        const citations = $('.gsc_rsb_std').first().text();

        console.log(`Citations found: ${citations}`);

        // Also try to get h-index (third std)
        const hIndex = $('.gsc_rsb_std').eq(2).text();
        console.log(`h-index found: ${hIndex}`);

    } catch (error) {
        console.error('Error fetching scholar data:', error);
    }
}

fetchScholar('https://scholar.google.com/citations?user=uLty40oAAAAJ&hl=en');
