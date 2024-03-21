import {extractCssContent, extractMarkup, setupPageForCrawling} from "./browser.js";

async function screenshotSvg(browser, key, viewportName, pageSize, store){
    const page = await browser.newPage();
    await page.setViewport({ width: pageSize.width, height: pageSize.height });

    const svgKey = key + '-' + viewportName + '-svg';
    const pngKey = key + '-' + viewportName + '-bitmap';

    await setupPageForCrawling(page);

    const navigationPromise = page.goto('http://localhost:3000/storage/key_value_stores/default/' + svgKey + '.svg');
    const networkIdlePromise = page.waitForNavigation({
        waitUntil: 'networkidle0',
    });

    await Promise.all([navigationPromise, networkIdlePromise]);

    const screenshotBuffer = await page.screenshot();
    await store.setValue(pngKey, screenshotBuffer, { contentType: 'image/png' });
}

async function saveScreen(page, key, viewportName, store) {
    const screenshotBuffer = await page.screenshot();
    await store.setValue(key + '-' + viewportName + '-screenshot', screenshotBuffer, { contentType: 'image/png' });
}

async function saveSvg(page, pageSize, key, viewportName, store) {
    await page.addScriptTag({url: 'http://localhost:3000/build/dom-to-svg.js'});

    const svg = await page.evaluate(async function(pageSize) {
        const svgDocument = DomToSVG.documentToSVG(document, {captureArea:
            pageSize
        });
        return new XMLSerializer().serializeToString(svgDocument);
    }, pageSize);

    await store.setValue(key + '-' + viewportName + '-svg', svg, { contentType: 'image/svg+xml' });
}

async function savePage(page, key, store) {
    const cssContents = await extractCssContent(page);
    const markup = await extractMarkup(page);
    const cssContentsText = cssContents.join("\n/* ------------------ */\n")

    await store.setValue(key + '-page', cssContentsText, { contentType: 'text/css' });
    await store.setValue(key + '-page', markup, { contentType: 'text/html' });

    let compositeMarkup = markup + "\n\n<style>\n" + cssContentsText + "\n</style>";

    await store.setValue(key + '-page-composite', compositeMarkup, { contentType: 'text/html' });
}



export { screenshotSvg, saveScreen, saveSvg, savePage };
