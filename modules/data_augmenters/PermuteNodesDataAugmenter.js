class PermuteNodesDataAugmenter {

    async augment(page) {
        await page.evaluate(() => {
            function permuteChildNodes(node) {
                if (node.nodeType !== Node.ELEMENT_NODE) {
                    return;
                }
                for (let i = 0; i < node.childNodes.length; i++) {
                    permuteChildNodes(node.childNodes[i]);
                }

                const children = Array.from(node.childNodes);
                children.sort(() => Math.random() - 0.5);

                while (node.firstChild) {
                    node.removeChild(node.firstChild);
                }

                for (let i = 0; i < children.length; i++) {
                    node.appendChild(children[i]);
                }
            }

            permuteChildNodes(document.body);
        });
    }
}

export default PermuteNodesDataAugmenter;
