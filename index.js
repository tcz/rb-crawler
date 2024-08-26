import { PuppeteerCrawler, Dataset, KeyValueStore } from 'crawlee';
import { startWebServer, stopWebServer } from './modules/server.js';
import { augmentPage, savePage, saveScreen, saveSvg, screenshotSvg } from './modules/data.js';
import { getPageSize, setupPageForCrawling, openLocalPage, loadLazyImages } from './modules/browser.js';
import { checkSimilarity } from "./modules/similarity.js";
import { join } from "path";

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
        const basePrefix = 'website';

        await page.setJavaScriptEnabled(true);

        await page.evaluate(() => {
            if (document.readyState === "complete") {
                return;
            }
            return new Promise((resolve) => {
                window.onload = resolve;
            });
        });

        await loadLazyImages(page);

        console.log('Saving page...');

        await savePage(page, basePrefix, KeyValueStore);

        let augmentedPagePrefixesWithNames = await augmentPage(page.browser(), basePrefix, KeyValueStore)
        var allPrefixes = [[basePrefix, undefined], ...augmentedPagePrefixesWithNames];

        for (let i = 0; i < allPrefixes.length; i++) {
            let [prefix, augmenterName] = allPrefixes[i];
            let isAugmented = !!augmenterName;

            let similarities = {};
            let pageSizes = {};

            console.log('Processing prefix ' + prefix + '...');

            for (const [viewportName, viewportSize] of Object.entries(VIEWPORT_SIZES)) {
                console.log('Saving viewport ' + viewportName + '...');

                const localPage = await openLocalPage(page.browser(), prefix, viewportSize);
                await localPage.setJavaScriptEnabled(true);

                const pageSize = await getPageSize(localPage);
                await localPage.setViewport({ width: pageSize.width, height: pageSize.height });

                console.log('Saving screen');
                let screenshotName = await saveScreen(localPage, prefix, viewportName, KeyValueStore);

                console.log('Saving SVG');
                await saveSvg(localPage, pageSize, prefix, viewportName, KeyValueStore);

                console.log('Screenshotting SVG');
                let svgBitmapName = await screenshotSvg(localPage.browser(), prefix, viewportName, pageSize, KeyValueStore);

                console.log('Calculating similarity');
                similarities[viewportName] = await checkSimilarity(
                    join('storage/key_value_stores/default', screenshotName),
                    join('storage/key_value_stores/default', svgBitmapName)
                );

                pageSizes[viewportName] = pageSize;
            }

            await Dataset.pushData({
                url: request.url,
                keyPrefix: prefix,
                similarities: similarities,
                pageSizes: pageSizes,
                isAugmented: isAugmented,
                augmenterName: augmenterName,
            });
        }
    },

    maxRequestsPerCrawl: 50,
});

startWebServer();

// Add first URL to the queue and start the crawl.
await crawler.run(['https://en.wikipedia.org/wiki/Main_Page']);
// await crawler.run(['http://0.0.0.0:9999/test3.html']);
// await crawler.run(['https://www.nytimes.com/']);
// await crawler.run(['https://www.underluckystars.com/en/']);
// await crawler.run(['https://www.empireonline.com/movies/features/star-wars-behind-scenes/']);


await stopWebServer();
process.exit(1);
