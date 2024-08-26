class DeleteRandomCssRulesDataAugmenter {
    constructor(deleteProbability) {
        this.deleteProbability = deleteProbability;
    }

    async augment(page) {
        await page.evaluate((deleteProbability) => {
            function deleteRandomCssRules(cssRules, deleteProbability) {
                let newCssText = '';
                for (let i = 0; i < cssRules.length; i++) {
                    if (cssRules[i].type === CSSRule.MEDIA_RULE) {
                        let cssText = cssRules[i].cssText;
                        let openingBraceIndex = cssText.indexOf("{");
                        let outerText = cssText.substring(0, openingBraceIndex + 1);

                        newCssText += outerText + deleteRandomCssRules(cssRules[i].cssRules, deleteProbability) + '}\n';

                        continue;
                    }

                    if (cssRules[i].type !== CSSRule.STYLE_RULE || Math.random() >= deleteProbability) {
                        newCssText += cssRules[i].cssText + '\n';
                    }
                }
                return newCssText;
            }

            // Since it's an already crawled page, there will only be <style> tags.
            let styles = document.getElementsByTagName('style');
            for (let i = 0; i < styles.length; i++) {
                let style = styles[i];
                let cssRules = style.sheet.cssRules;
                style.textContent = deleteRandomCssRules(cssRules, deleteProbability);
            }

        }, this.deleteProbability);
    }
}

export default DeleteRandomCssRulesDataAugmenter;
