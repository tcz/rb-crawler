import { PuppeteerCrawler, Dataset, KeyValueStore, RequestQueue } from 'crawlee';
import { startWebServer, stopWebServer } from './modules/server.js';
import {
    augmentPage, savePageToCloud, saveDatasetToCloud, savePage,
    saveScreen, saveSvg, screenshotSvg, getPageDataSize, reduceMarkup,
    chopPage
} from './modules/data.js';
import {
    getPageSize, setupPageForCrawling, openLocalPage, loadLazyImages,
    purgeCache, isSiteRobotFriendly, doesHaveMediaQueries
} from './modules/browser.js';
import {checkSimilarity, isAnyBlank} from "./modules/similarity.js";
import { shortId } from './modules/utils.js';
import { join } from "path";

let VIEWPORT_SIZES = {
    DESKTOP: { width: 1440, height: 900 },
    TABLET: { width: 834, height: 1210 }, // iPad Pro 11-inch (M4)
    MOBILE: { width: 393, height: 852 }, // iPhone 15
};

// Read run name from env variable, fail if does not exist
let runName = process.env.RUN_NAME;
if (!runName) {
    console.error('Please set the RUN_NAME environment variable.');
    process.exit(1);
}

let runIntervalFrom = process.env.RUN_INTERVAL_FROM;
if (undefined === runIntervalFrom) {
    console.error('Please set the RUN_INTERVAL_FROM environment variable.');
    process.exit(1);
}
runIntervalFrom = parseInt(runIntervalFrom, 10);

let runIntervalTo = process.env.RUN_INTERVAL_TO;
if (undefined === runIntervalTo) {
    console.error('Please set the RUN_INTERVAL_TO environment variable.');
    process.exit(1);
}
runIntervalTo = parseInt(runIntervalTo, 10);

console.log("Run name: " + runName);
console.log("Run interval: [" + runIntervalFrom + ', ' + runIntervalTo + "[");

let reduceMarkupSizeTo = process.env.REDUCE_MARKUP_SIZE_TO;
if (undefined !== reduceMarkupSizeTo) {
    reduceMarkupSizeTo = parseInt(reduceMarkupSizeTo, 10);
}

console.log("Reduce markup size to: " + (reduceMarkupSizeTo ? reduceMarkupSizeTo : "N/A"));

let chopPageTo = process.env.CHOP_PAGE_TO;
if (undefined !== chopPageTo) {
    if (undefined !== reduceMarkupSizeTo) {
        console.error('Cannot set both REDUCE_MARKUP_SIZE_TO and CHOP_PAGE_TO environment variables.');
        process.exit(1);
    }
    chopPageTo = parseInt(chopPageTo, 10);
}

console.log("Chop page to to: " + (chopPageTo ? chopPageTo : "N/A"));

let keepFiles = (parseInt(process.env.KEEP_FILES, 10) === 1);

let robotsStatistics = await KeyValueStore.getValue('robotsStatistics');
if (!robotsStatistics) {
    robotsStatistics = {
        rejected: {},
        allowed: {},
    };
}

console.log('Robot statistics:', {
    rejected: Object.keys(robotsStatistics.rejected).length,
    allowed: Object.keys(robotsStatistics.allowed).length
});

async function saveDataset() {
    console.log('Uploading dataset');
    await Dataset.exportToJSON('dataset');
    await saveDatasetToCloud(runName);
}

await saveDataset();

const crawler = new PuppeteerCrawler({

    preNavigationHooks: [
        async (crawlingContext, gotoOptions) => {
            const { request } = crawlingContext;

            if (!(await isSiteRobotFriendly(request.url))) {
                request.noRetry = true;
                robotsStatistics.rejected[request.url] = true;

                await KeyValueStore.setValue('robotsStatistics', robotsStatistics);
                console.log('Robot statistics:', {
                    rejected: Object.keys(robotsStatistics.rejected).length,
                    allowed: Object.keys(robotsStatistics.allowed).length
                });

                throw new Error('Site is not friendly to robots, skipping: ' + request.url);
            }
            robotsStatistics.allowed[request.url] = true;

            await KeyValueStore.setValue('robotsStatistics', robotsStatistics);
            console.log('Robot statistics:', {
                rejected: Object.keys(robotsStatistics.rejected).length,
                allowed: Object.keys(robotsStatistics.allowed).length
            });
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

        if (reduceMarkupSizeTo) {
            await page.setViewport({ width: VIEWPORT_SIZES.MOBILE.width, height: VIEWPORT_SIZES.MOBILE.height });
            await reduceMarkup(page.browser(), basePrefix, KeyValueStore, reduceMarkupSizeTo,
                { width: VIEWPORT_SIZES.MOBILE.width, height: VIEWPORT_SIZES.MOBILE.height });
        }

        var allPrefixes;
        if (chopPageTo) {
            let choppedPagePrefixes = await chopPage(page.browser(), basePrefix, KeyValueStore, chopPageTo);
            allPrefixes = choppedPagePrefixes;
        } else {
            let augmentedPagePrefixesWithNames = await augmentPage(page.browser(), basePrefix, KeyValueStore)
            allPrefixes = [[basePrefix, undefined], ...augmentedPagePrefixesWithNames];
        }

        for (let i = 0; i < allPrefixes.length; i++) {
            console.log('Processing prefix ' + allPrefixes[i][0] + ', ' + (i+1) + '/' + allPrefixes.length);

            let [prefix, augmenterName] = allPrefixes[i];
            let isAugmented = !!augmenterName;

            let similarities = {};
            let pageSizes = {};
            let svgLengths = {};
            let areThereBlankScreenshots = false;
            let hasMediaQueries = undefined;
            let pageDataSize = getPageDataSize(prefix);

            console.log('Processing prefix ' + prefix + '...');

            for (const [viewportName, viewportSize] of Object.entries(VIEWPORT_SIZES)) {
                console.log('Saving viewport ' + viewportName + '...');

                const localPage = await openLocalPage(page.browser(), prefix, viewportSize);
                await localPage.setJavaScriptEnabled(true);

                if (hasMediaQueries === undefined) {
                    hasMediaQueries = await doesHaveMediaQueries(localPage);
                }

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

                console.log('Calculating blank screens');
                if (!areThereBlankScreenshots) {
                    areThereBlankScreenshots = await isAnyBlank(
                        join('storage/key_value_stores/default', screenshotName),
                        join('storage/key_value_stores/default', svgBitmapName)
                    );
                }

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
                areThereBlankScreenshots: areThereBlankScreenshots,
                hasMediaQueries: hasMediaQueries,
                pageDataSize: pageDataSize,
            });

            console.log('Uploading pages');
            await savePageToCloud(runName, prefix, Object.keys(VIEWPORT_SIZES), keepFiles);
            await saveDataset();

            console.log('Cleaning up cache');
            purgeCache();
        }
    },

    maxRequestsPerCrawl: 100000,
    requestHandlerTimeoutSecs: chopPageTo ? 3600 : 300,
    maxRequestRetries: 2,

    minConcurrency: 5,
    maxConcurrency: 25,

    failedRequestHandler: function(data) {
        console.log('Failed request after all attempts, ignoring:', data.request.url);
        console.log('Cleaning up cache');
        purgeCache();
    },

    persistCookiesPerSession: false,

    launchContext: {
        useIncognitoPages: true,
        userAgent: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ReverseBrowser/1.0",
        launchOptions: {
            args: (process.getuid && process.getuid() === 0) ? ['--no-sandbox'] : [],
            ignoreHTTPSErrors: true
        }
    }

});

await startWebServer();

// Read urls.txt and put all the URLs per line in an array. Filter out empty lines.
import fs from 'fs';

let urls = fs.readFileSync('urls.txt', 'utf-8').split('\n').filter(Boolean);
urls = urls.slice(runIntervalFrom, runIntervalTo);

// Add first URL to the queue and start the crawl.
await crawler.run(urls);

await saveDataset();

console.log('Robot statistics:', {
    rejected: Object.keys(robotsStatistics.rejected).length,
    allowed: Object.keys(robotsStatistics.allowed).length
});

function waitForKey(keyCode) {
    return new Promise(resolve => {
        process.stdin.on('data',function (chunk) {
            if (chunk[0] === keyCode) {
                resolve();
                process.stdin.pause();
            }
        });
    });
}
console.log('Done, press ENTER to exit...');
await waitForKey(10);

await stopWebServer();

process.exit(0);
