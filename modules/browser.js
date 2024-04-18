import fs from 'fs';
import path, {dirname, join, resolve} from 'path';
import {fileURLToPath} from "url";
import crypto from 'crypto';

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), '../storage/key_value_stores/default'));

let offlinedUrls = {};

function shortId(url) {
    const hash = crypto.createHash('md5').update(url).digest('hex');
    return hash.substring(0, 5);
}

async function setupPageForCrawling(page) {
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);

    page.on("request", (request) => {
        if (request.resourceType() === "font") {
            request.abort();
        } else {
            request.continue();
        }
    });

    page.on("response", async (response) => {
        const url = response.url();
        const parsedUrl = new URL(url);

        if (parsedUrl.hostname === "localhost") {
            return;
        }

        if (offlinedUrls.hasOwnProperty(url)) {
            return;
        }

        const statusCode = response.status();
        if (statusCode < 200 || statusCode >= 300) {
            return;
        }

        if ("image" !== response.request().resourceType()) {
            return;
        }

        const basename = path.basename(url);
        const basenameWithoutParams = basename.split('?')[0];
        const extension = basenameWithoutParams.includes('.') ? ('.' + basenameWithoutParams.split('.').pop()) : '';
        const newName = '/' + shortId(url) + extension;
        const buffer = await response.buffer();

        fs.writeFileSync(path.join(root, newName), buffer);

        offlinedUrls[url] = newName;
    });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
}

async function getPageSize(page) {
    return await page.evaluate(async function () {
        return {
            x: 0,
            y: 0,
            width: document.documentElement.scrollWidth,
            height: document.documentElement.scrollHeight
        };
    });
}

async function extractCssContent(page) {
    return await page.evaluate(async (offlinedUrls) => {
        let baseTag = document.querySelector('base');
        let documentBaseUrl = baseTag ? baseTag.href : document.location.href;

        function convertUrls(cssText, baseUrl) {
            const urlRegex = /url\s*\((['"])?(.*?)\1\)/g;
            return cssText.replace(urlRegex, (match, quote, url) => {
                if (quote === undefined) {
                    quote = '';
                }

                const absoluteUrl = new URL(url, baseUrl).href;

                if (offlinedUrls[absoluteUrl]) {
                    return `url(${quote}${offlinedUrls[absoluteUrl]}${quote})`;
                }

                return `url(${quote}${absoluteUrl}${quote})`;
            });
        }

        const cssContents = [];
        const cssElements = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));

        for (const cssElement of cssElements) {
            if (cssElement.tagName === 'LINK') {
                const response = await fetch(cssElement.href);
                if (response.ok) {
                    let cssText = await response.text();
                    cssText = convertUrls(cssText, cssElement.href);
                    cssContents.push(cssText);
                }
            } else if (cssElement.tagName === 'STYLE') {
                cssContents.push(convertUrls(cssElement.textContent, documentBaseUrl));
            }
            cssElement.remove();
        }

        return cssContents;
    }, offlinedUrls);
}

async function extractMarkup(page) {
    return await page.evaluate(async (offlinedUrls) => {

        const elementsToRemove = Array.from(document.querySelectorAll('script, iframe, fencedframe, video, frame, frameset, object, embed, canvas, dialog, noscript'));
        for (const elementToRemove of elementsToRemove) {
            elementToRemove.remove();
        }

        const elementsWithSrc = Array.from(document.querySelectorAll('*[src]'));

        for (const elementWithSrc of elementsWithSrc) {
            if (offlinedUrls[elementWithSrc.currentSrc]) {
                elementWithSrc.src = offlinedUrls[elementWithSrc.currentSrc];
            } else {
                // Will assign absolute path.
                elementWithSrc.src = elementWithSrc.currentSrc;
            }
        }

        const elementsWithSrcSet = Array.from(document.querySelectorAll('*[srcset]'));

        for (const elementWithSrcSet of elementsWithSrcSet) {
            elementWithSrcSet.removeAttribute('srcset');
        }

        const baseElements = Array.from(document.querySelectorAll('base'));
        for (const baseElement of baseElements) {
            baseElement.remove();
        }

        return document.documentElement.outerHTML;
    }, offlinedUrls);
}

async function openLocalPage(browser, viewportSize, key) {
    const page = await browser.newPage();

    await setupPageForCrawling(page);
    await page.setViewport({ width: viewportSize.width, height: viewportSize.height });

    const navigationPromise = page.goto('http://localhost:3000/' + key + '-page-composite.html');
    const networkIdlePromise = page.waitForNavigation({
        waitUntil: 'networkidle0',
    });

    await Promise.all([navigationPromise, networkIdlePromise]);

    return page;
}

export { getPageSize, extractMarkup, extractCssContent, setupPageForCrawling, openLocalPage };
