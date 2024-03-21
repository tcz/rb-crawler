async function setupPageForCrawling(page) {
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", (request) => {
        if (request.resourceType() === "font") {
            console.log("Blocking font request: " + request.url());
            request.abort();
        } else {
            request.continue();
        }
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
    return await page.evaluate(async () => {
        const convertUrls = (cssText, baseUrl) => {
            const urlRegex = /url\s*\((['"])?(.*?)\1\)/g;
            return cssText.replace(urlRegex, (match, quote, url) => {
                if (url.startsWith('http') || url.startsWith('data:')) {
                    return match;
                }

                const absoluteUrl = new URL(url, baseUrl).href;
                return `url(${quote}${absoluteUrl}${quote})`;
            });
        };

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
                cssContents.push(cssElement.textContent);
            }
            cssElement.remove();
        }

        return cssContents;
    });
}

async function extractMarkup(page) {
    return await page.evaluate(async () => {
        const scriptElements = Array.from(document.querySelectorAll('script, iframe, fencedframe, video, frame, frameset, object, embed, canvas, dialog, noscript'));
        for (const scriptElement of scriptElements) {
            scriptElement.remove();
        }

        return document.documentElement.outerHTML;
    });
}

async function openLocalPage(browser, viewportSize, key) {
    const page = await browser.newPage();

    await setupPageForCrawling(page);
    await page.setViewport({ width: viewportSize.width, height: viewportSize.height });

    const navigationPromise = page.goto('http://localhost:3000/storage/key_value_stores/default/' + key + '-page-composite.html');
    const networkIdlePromise = page.waitForNavigation({
        waitUntil: 'networkidle0',
    });

    await Promise.all([navigationPromise, networkIdlePromise]);

    return page;
}

export { getPageSize, extractMarkup, extractCssContent, setupPageForCrawling, openLocalPage };
