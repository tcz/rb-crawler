import {extractCssContent, extractMarkup, openLocalPage, setupPageForCrawling, waitUntilComplete} from "./browser.js";
import {cleanSvg} from "./svg.js";
import fs from 'fs';
import {dirname, join, resolve} from "path";
import {fileURLToPath} from "url";
import AWS from 'aws-sdk';
import { PurgeCSS } from 'purgecss'
import {minify} from 'html-minifier';

import DeleteRandomNodesDataAugmenter from "./data_augmenters/DeleteRandomNodesDataAugmenter.js";
import PermuteNodesDataAugmenter from "./data_augmenters/PermuteNodesDataAugmenter.js";
import DeleteRandomCssRulesDataAugmenter from "./data_augmenters/DeleteRandomCssRulesDataAugmenter.js";
import ChangeCssRulesDataAugmenter from "./data_augmenters/ChangeCssRulesDataAugmenter.js";
import PermuteCssRulesDataAugmenter from "./data_augmenters/PermuteCssRulesDataAugmenter.js";
import MarkupSizeReducerDataAugmenter from "./data_augmenters/MarkupSizeReducerDataAugmenter.js";
import PageChopper from "./data_augmenters/PageChopper.js";

const domToSvgPath = resolve(join(dirname(fileURLToPath(import.meta.url)), '../build/dom-to-svg.js'));
const domToSvgJs = fs.readFileSync(domToSvgPath, 'utf8');

const augmenters = [
    {
        augmenter: new DeleteRandomNodesDataAugmenter(0.1),
        weight: 1
    },
    {
        augmenter: new DeleteRandomCssRulesDataAugmenter(0.25),
        weight: 1
    },
    {
        augmenter: new DeleteRandomCssRulesDataAugmenter(0.25),
        weight: 2
    },
    {
        augmenter: new PermuteNodesDataAugmenter(),
        weight: 1
    },
    {
        augmenter: new ChangeCssRulesDataAugmenter(),
        weight: 3
    },
    {
        augmenter: new PermuteCssRulesDataAugmenter(),
        weight: 1
    },
];

async function screenshotSvg(browser, key, viewportName, pageSize, store){
    const page = await browser.newPage();
    await page.setViewport({ width: pageSize.width, height: pageSize.height });

    const svgKey = key + '-' + viewportName + '-svg-clean';
    const pngKey = key + '-' + viewportName + '-bitmap';

    await setupPageForCrawling(page);

    const navigationPromise = page.goto('http://localhost:3000/' + svgKey + '.svg');
    const networkIdlePromise = page.waitForNavigation({
        waitUntil: 'networkidle0',
    });

    await Promise.all([navigationPromise, networkIdlePromise]);

    await waitUntilComplete(page);

    const screenshotBuffer = await page.screenshot();
    await store.setValue(pngKey, screenshotBuffer, { contentType: 'image/png' });

    return pngKey + '.png';
}

async function saveScreen(page, key, viewportName, store) {
    await waitUntilComplete(page);
    const screenshotBuffer = await page.screenshot();
    let pngKey = key + '-' + viewportName + '-screenshot';
    await store.setValue(pngKey, screenshotBuffer, { contentType: 'image/png' });

    return pngKey + '.png';
}

async function saveSvg(page, pageSize, key, viewportName, store) {
    await page.addScriptTag({content: domToSvgJs});

    const svg = await page.evaluate(async function(pageSize) {
        const svgDocument = DomToSVG.documentToSVG(document, {captureArea:
            pageSize
        });
        return new XMLSerializer().serializeToString(svgDocument);
    }, pageSize);

    const svgClean = await cleanSvg(svg);

    await store.setValue(key + '-' + viewportName + '-svg', svg, { contentType: 'image/svg+xml' });
    await store.setValue(key + '-' + viewportName + '-svg-clean', svgClean, { contentType: 'image/svg+xml' });

    return svgClean.length;
}

async function removeUnusedCss(markup, css) {
    let results = await new PurgeCSS().purge({
        content: [{
                raw: markup,
                extension: 'html'
        }],
        css: [{
                raw: css
        }],
        variables: true
    });

    if (!results[0]) {
        console.log('Something went wrong when purging CSS, returning full CSS');
        return css;
    }

    return results[0].css;
}

function minifyMarkup(markup) {
    var result = minify(markup, {
        collapseWhitespace: true,
        removeComments: true,
        sortAttributes: true,
        sortClassName: true,
    });
    return result;
}

async function savePage(page, key, store) {
    const cssContents = await extractCssContent(page);
    const markup = await extractMarkup(page);
    const cssContentsText = cssContents.join("\n\n")

    const cleanedCss = await removeUnusedCss(markup, cssContentsText);
    const minifiedMarkup = minifyMarkup(markup);

    await store.setValue(key + '-page', cleanedCss, { contentType: 'text/css' });
    await store.setValue(key + '-page-full', markup, { contentType: 'text/html' });
    await store.setValue(key + '-page', minifiedMarkup, { contentType: 'text/html' });

    let compositeMarkup = minifiedMarkup + "\n\n<style>\n" + cleanedCss + "\n</style>";

    await store.setValue(key + '-page-composite', compositeMarkup, { contentType: 'text/html' });
}

async function savePageToCloud(runName, key, viewportNames, keepFiles) {
    const s3 = new AWS.S3();
    const basePath = resolve(join(dirname(fileURLToPath(import.meta.url)), '../'));

    const filesToUpload = [
        key + '-page.html',
        key + '-page.css',
        key + '-page-composite.html',
    ];

    for (const viewportName of viewportNames) {
        filesToUpload.push(key + '-' + viewportName + '-svg.svg');
        filesToUpload.push(key + '-' + viewportName + '-svg-clean.svg');
        filesToUpload.push(key + '-' + viewportName + '-bitmap.png');
        filesToUpload.push(key + '-' + viewportName + '-screenshot.png');
    }

    let uploadPromises = [];

    for (const fileName of filesToUpload) {
        const fileContent = fs.readFileSync(join(basePath, 'storage/key_value_stores/default', fileName));

        const params = {
            Bucket: 'reverse-browser',
            Key: 'crawls/' + runName + '/' + fileName,
            Body: fileContent,
        };

        uploadPromises.push(s3.upload(params).promise());
    }

    await Promise.all(uploadPromises);

    if (!keepFiles) {
        for (const fileName of filesToUpload) {
            fs.unlinkSync(join(basePath, 'storage/key_value_stores/default', fileName));
        }
    }
}

function getPageDataSize(key) {
    const basePath = resolve(join(dirname(fileURLToPath(import.meta.url)), '../'));
    let stats = fs.statSync(join(basePath, 'storage/key_value_stores/default', key + '-page-composite.html'));

    return stats.size;
}

async function saveDatasetToCloud(runName) {
    const s3 = new AWS.S3();
    const basePath = resolve(join(dirname(fileURLToPath(import.meta.url)), '../'));
    const fileContent = fs.readFileSync(join(basePath, 'storage/key_value_stores/default/dataset.json'));

    const params = {
        Bucket: 'reverse-browser',
        Key: 'crawls/' + runName + '/dataset.json',
        Body: fileContent,
    };

    return s3.upload(params).promise();
}

function selectRandomAugmenter() {
    let totalWeight = augmenters.reduce((acc, augmenter) => acc + augmenter.weight, 0);
    let random = Math.random() * totalWeight;

    let currentWeight = 0;
    for (let i = 0; i < augmenters.length; i++) {
        currentWeight += augmenters[i].weight;
        if (random < currentWeight) {
            return augmenters[i].augmenter;
        }
    }
    return augmenters[augmenters.length - 1].augmenter;
}

async function reduceMarkup(browser, prefix, store, limit, viewportSize) {
    const localPage = await openLocalPage(browser, prefix, viewportSize);

    const reducer = new MarkupSizeReducerDataAugmenter(limit);
    await reducer.augment(localPage);

    await savePage(localPage, prefix, store);
}

async function augmentPage(browser, basePrefix, store) {
    let prefixes = [];
    // Only using a single augmenter per page, effectively doubling the data size.
    // This is to avoid too high training costs for the moment.

    let selectedAugmenters = [selectRandomAugmenter()];

    for (let i = 0; i < selectedAugmenters.length; i++) {
        let newPrefix = basePrefix + '-augmented-' + i;

        const localPage = await openLocalPage(browser, basePrefix);

        const augmenter = selectedAugmenters[i];
        await augmenter.augment(localPage);

        await savePage(localPage, newPrefix, store);

        prefixes.push([newPrefix, augmenter.constructor.name]);
    }
    return prefixes;
}

async function chopPage(browser, basePrefix, store, limit) {
    let prefixes = [];
    const chopper = new PageChopper(limit);
    let ordinal = 0;

    while(true) {
        let newPrefix = basePrefix + '-chopped-' + ordinal;

        const localPage = await openLocalPage(browser, basePrefix);

        let success = await chopper.chop(localPage, ordinal);
        if (!success) {
            break;
        }

        await savePage(localPage, newPrefix, store);
        prefixes.push([newPrefix, chopper.constructor.name]);

        ordinal++;
    }
    return prefixes;
}

export {
    screenshotSvg,
    saveScreen,
    saveSvg,
    savePage,
    savePageToCloud,
    saveDatasetToCloud,
    augmentPage,
    getPageDataSize,
    reduceMarkup,
    chopPage
};
