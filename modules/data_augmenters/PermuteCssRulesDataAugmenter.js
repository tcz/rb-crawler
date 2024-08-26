class PermuteCssRulesDataAugmenter {

    async augment(page) {
        await page.evaluate(() => {
            function permuteCssRules(cssRules) {
                let cssRuleTexts = [];
                for (let i = 0; i < cssRules.length; i++) {
                    if (cssRules[i].type === CSSRule.MEDIA_RULE) {
                        let cssText = cssRules[i].cssText;
                        let openingBraceIndex = cssText.indexOf("{");
                        let outerText = cssText.substring(0, openingBraceIndex + 1);

                        cssRuleTexts.push(outerText + permuteCssRules(cssRules[i].cssRules) + '}\n');

                        continue;
                    }

                    cssRuleTexts.push(cssRules[i].cssText + '\n');
                }

                cssRuleTexts.sort(() => Math.random() - 0.5);
                return cssRuleTexts.join('');
            }

            // Since it's an already crawled page, there will only be <style> tags.
            let styles = document.getElementsByTagName('style');
            for (let i = 0; i < styles.length; i++) {
                let style = styles[i];
                let cssRules = style.sheet.cssRules;
                style.textContent = permuteCssRules(cssRules);
            }

        });
    }
}

export default PermuteCssRulesDataAugmenter;
