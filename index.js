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

        await page.evaluate(() => {
            if (document.readyState === "complete") {
                return;
            }
            return new Promise((resolve) => {
                window.onload = resolve;
            });
        });

        await page.evaluate(async () => {
            document.body.scrollIntoView(false);

            await Promise.all(Array.from(document.getElementsByTagName('img'), image => {
                if (image.complete) {
                    return;
                }

                return new Promise((resolve, reject) => {
                    image.addEventListener('load', resolve);
                    image.addEventListener('error', resolve);
                });
            }));
        });

        console.log('Saving page...');

        await savePage(page, keyPrefix, KeyValueStore);

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
// await crawler.run(['http://0.0.0.0:9999/test3.html']);
// await crawler.run(['https://www.nytimes.com/']);

await stopWebServer();
process.exit(1);
