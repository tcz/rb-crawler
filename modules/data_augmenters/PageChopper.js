class PageChopper {
    constructor(markupSizeLimit) {
        this.markupSizeLimit = markupSizeLimit;
    }

    async chop(page, ordinal) {
        let success = await page.evaluate((markupSizeLimit, ordinal) => {
            for (let i = 0; i < document.body.attributes.length; i++) {
                document.body.removeAttribute(document.body.attributes[i].name);
            }

            let nodes = [];

            function collectNodes(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                    return;
                }

                if (node.nodeType === Node.ELEMENT_NODE && !node.checkVisibility({
                    opacityProperty: true,
                    contentVisibilityAuto: true,
                    visibilityProperty: true
                })) {
                    return;
                }

                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName !== 'BODY'
                        && node.tagName !== 'STYLE'
                        && node.outerHTML.length <= markupSizeLimit) {

                        nodes.push(node);
                        return;
                    }
                }

                for (let i = 0; i < node.childNodes.length; i++) {
                    collectNodes(node.childNodes[i]);
                }
            }

            collectNodes(document.body);

            if (ordinal >= nodes.length) {
                return false;
            }

            let selectedNode = nodes[ordinal];
            document.body.appendChild(selectedNode);

            let toRemove = [];

            function removeAllNodesBut(node, selectedNode) {
                if (node.tagName !== 'BODY' && node.tagName !== 'STYLE') {
                    if (node !== selectedNode) {
                        toRemove.push(node);
                        return;
                    }
                    return;
                }

                if (node.nodeType !== Node.TEXT_NODE && node.tagName !== 'STYLE') {
                    for (let i = 0; i < node.childNodes.length; i++) {
                        removeAllNodesBut(node.childNodes[i], selectedNode);
                    }
                }
            }

            removeAllNodesBut(document.body, selectedNode);
            for (let i = 0; i < toRemove.length; i++) {
                toRemove[i].remove();
            }

            return true;
        }, this.markupSizeLimit, ordinal);

        return success;
    }
}

export default PageChopper;



