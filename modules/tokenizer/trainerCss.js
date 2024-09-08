import puppeteer from 'puppeteer';

async function collectCssTokens(page) {
    return await page.evaluate(() => {
        function collectCssPropertyNames(cssRule) {
            let propertyNames = new Set();

            for (let i = 0; i < cssRule.style.length; i++) {
                let property = cssRule.style[i];
                // CSS variable
                if (property.startsWith('--')) {
                    continue;
                }
                propertyNames.add(property);
            }

            return propertyNames;
        }

        function collectCssNames(cssRules) {
            let propertyNames = new Set();

            for (let i = 0; i < cssRules.length; i++) {
                if (cssRules[i].type === CSSRule.MEDIA_RULE) {
                    let [mediaPropertyNames] = collectCssNames(cssRules[i].cssRules)
                    propertyNames = propertyNames.union(mediaPropertyNames);
                } else if (cssRules[i].type === CSSRule.STYLE_RULE) {
                    propertyNames = propertyNames.union(collectCssPropertyNames(cssRules[i]));
                }
            }

            return [propertyNames];
        }

        let styles = document.getElementsByTagName('style');

        let allPropertyNames = new Set();
        for (let i = 0; i < styles.length; i++) {
            let [propertyNames] = collectCssNames(styles[i].sheet.cssRules);
            allPropertyNames = allPropertyNames.union(propertyNames);
        }

        return {
            propertyNames: Array.from(allPropertyNames),
        };
    });
}

function orderByOccurrance(object) {
    const orderedEntries = Object.entries(object).sort((a, b) => b[1] - a[1]);
    return Object.fromEntries(orderedEntries);
}

async function collectCssTokensFromUrls(urls) {
    const browser = await puppeteer.launch();

    let propertyNameCounts = {};

    for (let i = 0; i < urls.length; i++) {
        const page = await browser.newPage();
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        console.log(urls[i]);
        await page.goto(urls[i]);

        let tokens = await collectCssTokens(page);

        for (let j = 0; j < tokens.propertyNames.length; j++) {
            if (!propertyNameCounts[tokens.propertyNames[j]]) {
                propertyNameCounts[tokens.propertyNames[j]] = 0;
            }
            propertyNameCounts[tokens.propertyNames[j]]++;
        }
    }

    await browser.close();

    propertyNameCounts = orderByOccurrance(propertyNameCounts);

    return [ propertyNameCounts ];
}


export { collectCssTokensFromUrls };
