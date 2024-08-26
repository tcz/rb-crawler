class DeleteRandomNodesDataAugmenter {
    constructor(deleteProbability) {
        this.deleteProbability = deleteProbability;
    }

    async augment(page) {
        await page.evaluate((deleteProbability) => {
            function deleteRandomNodes(node, deleteProbability) {
                if (node.nodeType === Node.TEXT_NODE) {
                    return;
                }

                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (Math.random() < deleteProbability && node.tagName !== 'BODY') {
                        node.remove();
                        return;
                    }
                }

                for (let i = 0; i < node.childNodes.length; i++) {
                    deleteRandomNodes(node.childNodes[i], deleteProbability);
                }
            }

            deleteRandomNodes(document.body, deleteProbability);
        }, this.deleteProbability);
    }
}

export default DeleteRandomNodesDataAugmenter;
