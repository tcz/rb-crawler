    import xmldoc from 'xmldoc';

async function cleanSvg(svgText) {
    const attributesToRemove = ['role'];
    const attributePrefixToRemove = ['data-', 'aria-'];
    const nodesToRemove = ['title'];
    const nodesToRemoveIfEmpty = ['g', 'style'];

    return new Promise((resolve, reject) => {
        function cleanNode(node) {
            if (node.constructor.name === 'XmlCommentNode') {
                return null;
            }
            if (!node.name) {
                return node;
            }
            if (nodesToRemove.includes(node.name.toLowerCase())) {
                return null;
            }
            if (nodesToRemoveIfEmpty.includes(node.name.toLowerCase()) && node.children.length === 0) {
                return null;
            }
            if (node.attr) {
                for (const attribute of attributesToRemove) {
                    if (attribute in node.attr) {
                        delete node.attr[attribute];
                    }
                }

                for (const attribute in node.attr) {
                    for (const prefix of attributePrefixToRemove) {
                        if (attribute.startsWith(prefix)) {
                            delete node.attr[attribute];
                        }
                    }
                    if (attribute === 'href'
                        && (node.attr[attribute].startsWith('http') || node.name.toLowerCase() === 'a')) {
                        node.attr[attribute] = '';
                    }
                }
            }

            if (node.children && node.name === 'svg') {
                let i = node.children.length;
                while (i--) {
                    let newNode = cleanNode(node.children[i]);
                    if (newNode === null) {
                        node.children.splice(i, 1);
                    } else {
                        node.children[i] = newNode;
                    }
                }
            }

            return node;
        }

        var document = new xmldoc.XmlDocument(svgText);
        document = cleanNode(document);

        const xml = document.toString({compressed:true})
        resolve(xml.replace(/http:\/\/localhost:3000/g, ''));

    });
}

export { cleanSvg };
