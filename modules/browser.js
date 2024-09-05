import fs from 'fs';
import path, {dirname, join, resolve} from 'path';
import {fileURLToPath} from "url";
import {shortId} from './utils.js';
import robotsParser from "robots-txt-parser";
import mime from 'mime-types';

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), '../storage/key_value_stores/default'));

let offlinedUrls = {};

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
        let extension = basenameWithoutParams.includes('.') ? ('.' + basenameWithoutParams.split('.').pop()) : '';

        const headers = response.headers();
        if (headers['content-type']) {
            extension = extensionFromContentType(headers['content-type'], extension);
        }

        const newName = '/' + shortId(url) + extension;

        try {
            const buffer = await response.buffer();
            fs.writeFileSync(path.join(root, newName), buffer);
            offlinedUrls[url] = newName;
        } catch (error) {
            console.error("Could not offline " + url + ", error:", error);
        }
    });

    //page.on('console', msg => console.log('PAGE LOG:', msg.text()));
}

function purgeCache() {
    for (const url in offlinedUrls) {
        // Check if file is older than 5 minutes.
        let absolutePath = path.join(root, offlinedUrls[url]);
        if (fs.statSync(absolutePath).mtime < Date.now() - 300000) {
            fs.unlinkSync(absolutePath);
            delete offlinedUrls[url];
        }
    }
    offlinedUrls = {};
}

function extensionFromContentType(contentType, fallback) {
    let extension = mime.extension(contentType);
    if (!extension || 'bin' === extension) {
        return fallback;
    }
    return '.' + extension;
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

function removeHtmlComments(html) {
    return html.replace(/<!--[\s\S]*?-->/g, '');
}

function removeCssComments(css) {
    return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

async function extractCssContent(page) {
    let cssContents = await page.evaluate(async (offlinedUrls) => {
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

    return cssContents.map(removeCssComments);
}

async function waitUntilComplete(page) {
    return new Promise((resolve, reject) => {
        async function checkReadyState() {
            try {
                var readyState = await page.evaluate(function () {
                    return document.readyState;
                });
            } catch (e) {
                reject();
                return;
            }

            if ("complete" === readyState) {
                setTimeout(resolve, 2000);
            } else {
                await checkReadyState();
            }
        }
        checkReadyState();
        setTimeout(reject, 30000);
    });
}

async function extractMarkup(page) {
    await page.evaluate(async (offlinedUrls) => {

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
    }, offlinedUrls);

    let html = await page.evaluate(async () => {
        return document.documentElement.outerHTML;
    });

    return removeHtmlComments(html);
}

async function openLocalPage(browser, key, viewportSize) {
    const page = await browser.newPage();

    await setupPageForCrawling(page);

    if (viewportSize) {
        await page.setViewport({ width: viewportSize.width, height: viewportSize.height });
    }

    const navigationPromise = page.goto('http://localhost:3000/' + key + '-page-composite.html');
    const networkIdlePromise = page.waitForNavigation({
        waitUntil: 'networkidle0',
    });

    await Promise.all([navigationPromise, networkIdlePromise]);

    return page;
}

function loadLazyImages(page) {
    return page.evaluate(async () => {
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
}

async function isSiteRobotFriendly(url) {
    const {protocol, hostname} = new URL(url);
    const domain = protocol + '//' + hostname;

    const robotsToTest = [
        'Googlebot',
        'OAI-SearchBot',
        'ChatGPT-User',
        'GPTBot',
        'ReverseBrowser'
    ];

    for (const robot of robotsToTest) {
        const robotsParserInstance = robotsParser({
                userAgent: robot,
                allowOnNeutral: true
            });

        await robotsParserInstance.useRobotsFor(domain);
        if (!robotsParserInstance.canCrawlSync(url)) {
            return false;
        }
    }
    return true;
}

async function doesHaveMediaQueries(page) {
    return await page.evaluate(() => {
        // Since it's an already crawled page, there will only be <style> tags.
        let styles = document.getElementsByTagName('style');
        for (let i = 0; i < styles.length; i++) {
            let style = styles[i];
            let cssRules = style.sheet.cssRules;

            for (let j = 0; j < cssRules.length; j++) {
                if (cssRules[j].type === CSSRule.MEDIA_RULE) {
                    return true;
                }
            }
        }

        return false;
    });
}

export {
    getPageSize,
    extractMarkup,
    extractCssContent,
    setupPageForCrawling,
    openLocalPage,
    waitUntilComplete,
    loadLazyImages,
    purgeCache,
    isSiteRobotFriendly,
    doesHaveMediaQueries
};
