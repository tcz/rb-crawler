import xml2js from "xml2js";
import traverse from "traverse";

async function cleanSvg(svgText) {
    const attributesToRemove = ['role'];
    const attributePrefixToRemove = ['data-', 'aria-'];

    return new Promise((resolve, reject) => {
        xml2js.parseString(svgText, function (err, result) {
            if (err) {
                console.error(err);
                reject(err);
            }

            traverse(result).forEach(function (node) {
                if (this.parent && this.parent.node['$']) {
                    for (const attr of attributesToRemove) {
                        if (this.parent.node['$'][attr]) {
                            delete this.parent.node['$'][attr];
                        }
                    }

                    if (this.parent.node['$']['href'] && this.parent.node['$']['href'].startsWith('http')) {
                        this.parent.node['$']['href'] = '';
                    }

                    for (const attr in this.parent.node['$']) {
                        for (const prefix of attributePrefixToRemove) {
                            if (attr.startsWith(prefix)) {
                                delete this.parent.node['$'][attr];
                            }
                        }
                    }
                }
            });

            const builder = new xml2js.Builder();
            const xml = builder.buildObject(result);

            resolve(xml.replace(/http:\/\/localhost:3000/g, ''));

            resolve(xml);
        });
    });
}

export { cleanSvg };
