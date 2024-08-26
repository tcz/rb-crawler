class ChangeCssRulesDataAugmenter {

    async augment(page) {
        await page.evaluate(() => {
            function getRandomColor() {
                const formats = ["hex3", "hex6", "rgb", "rgba", "named"];
                const format = formats[Math.floor(Math.random() * formats.length)];

                switch (format) {
                    case "hex3":
                        return '#' + Math.floor(Math.random() * 0xFFF).toString(16).padStart(3, '0');
                    case "hex6":
                        return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
                    case "rgb":
                        return `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
                    case "rgba":
                        return `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.random().toFixed(1)})`;
                    case "named":
                        const colors = ["black", "white", "red", "green", "blue", "yellow"];
                        return colors[Math.floor(Math.random() * colors.length)];
                }
            }

            function changePropertyRandomly(property, propertyValue) {
                if (propertyValue.startsWith('#') || propertyValue.startsWith('rgb')) {
                    return getRandomColor();
                }
                let matches = propertyValue.match(/^(-?\d*\.?\d+)(pt|px|em|rem|%|vh|vw)$/);
                if (matches) {
                    let number = parseFloat(matches[1]);
                    let unit = matches[2];
                    let newNumber = number + Math.random() * 10 - 5;
                    return newNumber.toFixed(unit === 'px' ? 0 : 2) + unit;
                }
                return propertyValue;
            }

            function changeAndRerenderStyle(cssRule) {
                let openingBraceIndex = cssRule.cssText.indexOf("{");
                let outerText = cssRule.cssText.substring(0, openingBraceIndex + 1);
                let newInnerText = '';

                for (let i = 0; i < cssRule.style.length; i++) {
                    let property = cssRule.style[i];
                    let propertyValue = cssRule.style.getPropertyValue(property);
                    newInnerText += property + ': ' + changePropertyRandomly(property, propertyValue) + ';\n';
                }

                return outerText + '\n' + newInnerText + '}';
            }

            function changeCssRules(cssRules) {
                let newCssText = '';
                for (let i = 0; i < cssRules.length; i++) {
                    if (cssRules[i].type === CSSRule.MEDIA_RULE) {
                        let cssText = cssRules[i].cssText;
                        let openingBraceIndex = cssText.indexOf("{");
                        let outerText = cssText.substring(0, openingBraceIndex + 1);

                        newCssText += outerText + changeCssRules(cssRules[i].cssRules) + '}\n';

                        continue;
                    }

                    if (cssRules[i].type !== CSSRule.STYLE_RULE) {
                        newCssText += cssRules[i].cssText + '\n';
                        continue;
                    }

                    newCssText += changeAndRerenderStyle(cssRules[i]) + '\n';
                }
                return newCssText;
            }

            // Since it's an already crawled page, there will only be <style> tags.
            let styles = document.getElementsByTagName('style');
            for (let i = 0; i < styles.length; i++) {
                let style = styles[i];
                let cssRules = style.sheet.cssRules;
                style.textContent = changeCssRules(cssRules);
            }

        });
    }
}

export default ChangeCssRulesDataAugmenter;
