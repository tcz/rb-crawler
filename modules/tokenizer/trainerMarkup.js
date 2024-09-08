import puppeteer from 'puppeteer';

async function collectMarkupTokens(page) {
    return await page.evaluate(() => {
        function collectAttributeNames(node) {
            let attributeNames = new Set();

            for (let i = 0; i < node.attributes.length; i++) {
                attributeNames.add(node.attributes[i].name);
            }

            return attributeNames;
        }

        function collectNodeNames(node) {
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return [new Set(), new Set()];
            }

            let nodeNames = new Set([node.nodeName]);
            let attributeNames = collectAttributeNames(node);

            for (let i = 0; i < node.childNodes.length; i++) {
                let childNodeNames, childAttributeNames;
                [childNodeNames, childAttributeNames] = collectNodeNames(node.childNodes[i]);
                nodeNames = nodeNames.union(childNodeNames);
                attributeNames = attributeNames.union(childAttributeNames);
            }

            return [nodeNames, attributeNames];
        }

        let nodeNames, attributeNames;
        [nodeNames, attributeNames] = collectNodeNames(document.body);

        return {
            nodeNames: Array.from(nodeNames),
            attributeNames: Array.from(attributeNames)
        };
    });
}

function orderByOccurrance(object) {
    const orderedEntries = Object.entries(object).sort((a, b) => b[1] - a[1]);
    return Object.fromEntries(orderedEntries);
}

async function collectMarkupTokensFromUrls(urls) {
    const browser = await puppeteer.launch();

    let nodeNameCounts = {};
    let attributeNameCounts = {};

    for (let i = 0; i < urls.length; i++) {
        const page = await browser.newPage();
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        await page.goto(urls[i]);
        let tokens = await collectMarkupTokens(page);

        for (let j = 0; j < tokens.nodeNames.length; j++) {
            if (!nodeNameCounts[tokens.nodeNames[j]]) {
                nodeNameCounts[tokens.nodeNames[j]] = 0;
            }
            nodeNameCounts[tokens.nodeNames[j]]++;
        }
        for (let j = 0; j < tokens.attributeNames.length; j++) {
            if (!attributeNameCounts[tokens.attributeNames[j]]) {
                attributeNameCounts[tokens.attributeNames[j]] = 0;
            }
            attributeNameCounts[tokens.attributeNames[j]]++;
        }
    }

    await browser.close();

    nodeNameCounts = orderByOccurrance(nodeNameCounts);
    attributeNameCounts = orderByOccurrance(attributeNameCounts);

    return [ nodeNameCounts, attributeNameCounts ];
}

export { collectMarkupTokensFromUrls };


