import { PuppeteerCrawler, Dataset, KeyValueStore } from 'crawlee';
import { startWebServer, stopWebServer } from './modules/server.js';
import { savePage, saveScreen, saveSvg, screenshotSvg } from './modules/data.js';
import { getPageSize, setupPageForCrawling, openLocalPage } from './modules/browser.js';

let VIEWPORT_SIZES = {
    DESKTOP: { width: 1440, height: 900 },
    MOBILE: { width: 393, height: 852 }, // iPhone 15
};

const crawler = new PuppeteerCrawler({

    preNavigationHooks: [
        async (crawlingContext, gotoOptions) => {
            const { page } = crawlingContext;
            gotoOptions.waitUntil = 'networkidle0';
            await setupPageForCrawling(page);
        },
    ],

    async requestHandler({ request, page, enqueueLinks, saveSnapshot, log }) {
        //const keyPrefix = request.url.replace(/[:/]/g, '_');
        const keyPrefix = 'website';

        await page.setJavaScriptEnabled(true);
        await savePage(page, keyPrefix, KeyValueStore)

        for (const [viewportName, viewportSize] of Object.entries(VIEWPORT_SIZES)) {
            const localPage = await openLocalPage(page.browser(), viewportSize, keyPrefix);
            await localPage.setJavaScriptEnabled(true);

            const pageSize = await getPageSize(localPage);
            await localPage.setViewport({ width: pageSize.width, height: pageSize.height });

            await saveScreen(localPage, keyPrefix, viewportName, KeyValueStore);
            await saveSvg(localPage, pageSize, keyPrefix, viewportName, KeyValueStore);
            await screenshotSvg(localPage.browser(), keyPrefix, viewportName, pageSize, KeyValueStore);
        }

        await Dataset.pushData({
            url: request.url,
            keyPrefix: keyPrefix,
        });
    },

    maxRequestsPerCrawl: 50,
});

startWebServer();

// Add first URL to the queue and start the crawl.
await crawler.run(['https://en.wikipedia.org/wiki/Main_Page']);
// await crawler.run(['https://www.nytimes.com/']);

await stopWebServer();
process.exit(1);
