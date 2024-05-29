import {extractCssContent, extractMarkup, setupPageForCrawling, waitUntilComplete} from "./browser.js";
import {cleanSvg} from "./svg.js";
import fs from 'fs';
import {dirname, join, resolve} from "path";
import {fileURLToPath} from "url";

const domToSvgPath = resolve(join(dirname(fileURLToPath(import.meta.url)), '../build/dom-to-svg.js'));
const domToSvgJs = fs.readFileSync(domToSvgPath, 'utf8');

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
}

async function saveScreen(page, key, viewportName, store) {
    await waitUntilComplete(page);
    const screenshotBuffer = await page.screenshot();
    await store.setValue(key + '-' + viewportName + '-screenshot', screenshotBuffer, { contentType: 'image/png' });
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
}

async function savePage(page, key, store) {
    const cssContents = await extractCssContent(page);
    const markup = await extractMarkup(page);
    const cssContentsText = cssContents.join("\n\n")

    await store.setValue(key + '-page', cssContentsText, { contentType: 'text/css' });
    await store.setValue(key + '-page', markup, { contentType: 'text/html' });

    let compositeMarkup = markup + "\n\n<style>\n" + cssContentsText + "\n</style>";

    await store.setValue(key + '-page-composite', compositeMarkup, { contentType: 'text/html' });
}



export { screenshotSvg, saveScreen, saveSvg, savePage };
