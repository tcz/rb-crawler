class MarkupSizeReducerDataAugmenter {
    constructor(markupSizeLimit) {
        this.markupSizeLimit = markupSizeLimit;
    }

    async augment(page) {
        if (await this.getMarkupSize(page) > this.markupSizeLimit) {
            await page.evaluate(() => {
                let toRemove = [];

                function isInViewport(element) {
                    if (!element.checkVisibility({
                        opacityProperty: true,
                        contentVisibilityAuto: true,
                        visibilityProperty: true
                    })) {
                        return false;
                    }

                    const rect = element.getBoundingClientRect();
                    const windowHeight =
                        window.innerHeight || document.documentElement.clientHeight;
                    const windowWidth =
                        window.innerWidth || document.documentElement.clientWidth;

                    return (
                        rect.bottom >= 0 &&
                        rect.right >= 0 &&
                        rect.top <= windowHeight &&
                        rect.left <= windowWidth
                    );
                }

                function deleteNodesNotInViewport(node) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        return;
                    }

                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (!isInViewport(node) && node.tagName !== 'BODY' && node.tagName !== 'STYLE') {
                            toRemove.push(node);
                            return;
                        }
                    }

                    for (let i = 0; i < node.childNodes.length; i++) {
                        deleteNodesNotInViewport(node.childNodes[i]);
                    }
                }

                deleteNodesNotInViewport(document.body);
                for (let i = 0; i < toRemove.length; i++) {
                    toRemove[i].remove();
                }
            });
        }

        if (await this.getMarkupSize(page) > this.markupSizeLimit) {
            await page.evaluate(() => {
                function shortenTextNodes(node) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        if (node.textContent.length > 25) {
                            node.textContent = node.textContent.substring(0, 25) + node.textContent.substring(node.textContent.length - 1);
                        }
                    }

                    for (let i = 0; i < node.childNodes.length; i++) {
                        if ('STYLE' === node.tagName) {
                            continue;
                        }
                        shortenTextNodes(node.childNodes[i]);
                    }
                }

                shortenTextNodes(document.body);
            });
        }

        if (await this.getMarkupSize(page) > this.markupSizeLimit) {
            let charsNeededToRemove = (await this.getMarkupSize(page)) - this.markupSizeLimit;

            await page.evaluate((charsNeededToRemove) => {
                let toRemove = [];
                function removeElementsFromBottom(node, charsLeftToRemove) {

                    if (node.nodeType === Node.TEXT_NODE) {
                        return 0;
                    }

                    let charsRemovedFromChildren = 0;
                    for (let i = node.childNodes.length - 1; i >= 0; i--) {
                        charsRemovedFromChildren += removeElementsFromBottom(
                            node.childNodes[i],
                            charsLeftToRemove - charsRemovedFromChildren
                        );

                        if (charsRemovedFromChildren >= charsLeftToRemove) {
                            return charsRemovedFromChildren;
                        }
                    }

                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName !== 'BODY' && node.tagName !== 'STYLE') {
                            toRemove.push(node);
                            return node.outerHTML.length;
                        }
                    }

                    return 0;
                }

                removeElementsFromBottom(document.body, charsNeededToRemove);
                for (let i = 0; i < toRemove.length; i++) {
                    toRemove[i].remove();
                }
            }, charsNeededToRemove);
        }
    }

    async getMarkupSize(page) {
        return await page.evaluate(async () => {
            let totalSize = document.documentElement.outerHTML.length;
            let styleElements = document.body.getElementsByTagName('style');
            for (let i = 0; i < styleElements.length; i++) {
                totalSize -= styleElements[i].outerHTML.length;
            }

            return totalSize;
        });
    }
}

export default MarkupSizeReducerDataAugmenter;



