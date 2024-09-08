import fs from 'fs';
import xmldoc from 'xmldoc';

async function collectSvgTokens(svgText) {

    function collectNodeNames(node) {
        let nodeNames = new Set([node.name]);
        let attributeNames = new Set();

        if (node.attr) {
            for (const attr in node.attr) {
                attributeNames.add(attr);
            }
        }

        if (node.children) {
            for (let i = 0; i < node.children.length; i++) {
                let childNodeNames, childAttributeNames;
                [childNodeNames, childAttributeNames] = collectNodeNames(node.children[i]);
                childNodeNames.forEach(nodeNames.add, nodeNames);
                childAttributeNames.forEach(attributeNames.add, attributeNames);
            }
        }

        return [nodeNames, attributeNames];
    }

    var document = new xmldoc.XmlDocument(svgText);

    let [nodeNames, attributeNames] = collectNodeNames(document);

    return {
        nodeNames: Array.from(nodeNames),
        attributeNames: Array.from(attributeNames)
    };
}

function orderByOccurrance(object) {
    const orderedEntries = Object.entries(object).sort((a, b) => b[1] - a[1]);
    return Object.fromEntries(orderedEntries);
}

async function collectSvgTokensFromPaths(paths) {

    let nodeNameCounts = {};
    let attributeNameCounts = {};

    for (let i = 0; i < paths.length; i++) {

        const contents = fs.readFileSync(paths[i], 'utf8');

        let tokens = await collectSvgTokens(contents);

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

    nodeNameCounts = orderByOccurrance(nodeNameCounts);
    attributeNameCounts = orderByOccurrance(attributeNameCounts);

    return [ nodeNameCounts, attributeNameCounts ];
}

export { collectSvgTokensFromPaths };


