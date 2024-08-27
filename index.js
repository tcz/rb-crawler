import { PuppeteerCrawler, Dataset, KeyValueStore } from 'crawlee';
import { startWebServer, stopWebServer } from './modules/server.js';
import { augmentPage, savePageToCloud, saveDatasetToCloud, savePage,
    saveScreen, saveSvg, screenshotSvg } from './modules/data.js';
import { getPageSize, setupPageForCrawling, openLocalPage, loadLazyImages,
    cleanUpCache, isSiteRobotFriendly } from './modules/browser.js';
import { checkSimilarity } from "./modules/similarity.js";
import { shortId } from './modules/utils.js';
import { join } from "path";

let VIEWPORT_SIZES = {
    DESKTOP: { width: 1440, height: 900 },
    MOBILE: { width: 393, height: 852 }, // iPhone 15
};

let runName = 'run-' + new Date().toISOString().replace(/[:.]/g, '-');
let robotsStatistics = {
    rejected: 0,
    allowed: 0,
};

const crawler = new PuppeteerCrawler({

    preNavigationHooks: [
        async (crawlingContext, gotoOptions) => {
            const { request } = crawlingContext;

            if (!(await isSiteRobotFriendly(request.url))) {
                request.noRetry = true;
                robotsStatistics.rejected++;
                throw new Error('Site is not friendly to robots, skipping: ' + request.url);
            }
            robotsStatistics.allowed++;
        },
        async (crawlingContext, gotoOptions) => {
            const { page } = crawlingContext;
            gotoOptions.waitUntil = 'networkidle0';
            await setupPageForCrawling(page);
        },
    ],

    async requestHandler({ request, page, enqueueLinks, saveSnapshot, log }) {
        const basePrefix = shortId(request.url);

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
            let svgLengths = {};

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
                let svgLength = await saveSvg(localPage, pageSize, prefix, viewportName, KeyValueStore);

                console.log('Screenshotting SVG');
                let svgBitmapName = await screenshotSvg(localPage.browser(), prefix, viewportName, pageSize, KeyValueStore);

                console.log('Calculating similarity');
                similarities[viewportName] = await checkSimilarity(
                    join('storage/key_value_stores/default', screenshotName),
                    join('storage/key_value_stores/default', svgBitmapName)
                );

                pageSizes[viewportName] = pageSize;
                svgLengths[viewportName] = svgLength;
            }

            await Dataset.pushData({
                url: request.url,
                prefix: prefix,
                similarities: similarities,
                pageSizes: pageSizes,
                svgLengths: svgLengths,
                isAugmented: isAugmented,
                augmenterName: augmenterName,
            });

            console.log('Uploading pages');
            await savePageToCloud(runName, prefix, Object.keys(VIEWPORT_SIZES));

            console.log('Cleaning up cache');
            cleanUpCache();
        }
    },

    maxRequestsPerCrawl: 100000,
    requestHandlerTimeoutSecs: 300,
    maxRequestRetries: 2,

    minConcurrency: 5,
    maxConcurrency: 50,

    failedRequestHandler: function(data) {
        console.log('Failed request after all attempts, ignoring:', data.request.url);
        console.log('Cleaning up cache');
        cleanUpCache();
    },

    launchContext: {
        useIncognitoPages: true,
        userAgent: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ReverseBrowser/1.0"
    }
});

startWebServer();


// Generate a list of URLs like this: https://en.wikipedia.org/wiki/Main_Page?test=1 where the number increases from 1
// to 1000.
// const urls = Array.from({ length: 1000 }, (_, i) => `https://en.wikipedia.org/wiki/Main_Page?test=${i + 1}`);

// Read urls.txt and put all the URLs per line in an array. Filter out empty lines.
import fs from 'fs';
let urls = fs.readFileSync('urls.txt', 'utf-8').split('\n').filter(Boolean);
urls = urls.slice(0, 1000);

// Add first URL to the queue and start the crawl.
// await crawler.run(['https://en.wikipedia.org/wiki/Main_Page']);
// await crawler.run([
//     'https://this-does-not-exists.com/bla-bla.html',
//     'https://en.wikipedia.org/wiki/Main_Page',
//     'https://www.nytimes.com/',
// ]);
// await crawler.run(['http://0.0.0.0:9999/test3.html']);
// await crawler.run(['https://www.nytimes.com/']);
// await crawler.run(['https://www.underluckystars.com/en/']);
// await crawler.run(['https://www.empireonline.com/movies/features/star-wars-behind-scenes/']);
await crawler.run(urls);

console.log('Uploading dataset');
await Dataset.exportToJSON('dataset');
await saveDatasetToCloud(runName);
await stopWebServer();

console.log('Robots statistics:', robotsStatistics);

process.exit(1);
