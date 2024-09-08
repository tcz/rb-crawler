import fs from "fs";
import {dirname, join, resolve} from "path";
import {fileURLToPath} from "url";
import {startTrainingServer, stopTrainingServer} from "./server.js";
import {collectMarkupTokensFromUrls} from "./trainerMarkup.js";
import {collectCssTokensFromUrls} from "./trainerCss.js";
import {collectSvgTokensFromPaths} from "./trainerSvg.js";

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), 'data'));

const markupFiles = fs.readdirSync(root)
    .filter(file => file.endsWith('-page.html'));

const cssFiles = fs.readdirSync(root)
    .filter(file => file.endsWith('-page.css'));

const svgFiles = fs.readdirSync(root)
    .filter(file => file.endsWith('-svg-clean.svg'));

await startTrainingServer();

// let urls = markupFiles.map(file => `http://localhost:3001/${file}`);
// let [ nodeNameCounts, attributeNameCounts ] = await collectMarkupTokensFromUrls(urls);
// console.log(nodeNameCounts);
// console.log(attributeNameCounts);

//
// let urls = cssFiles.map(file => `http://localhost:3001/css-html/${file}`);
// let [ propertyNameCounts ] = await collectCssTokensFromUrls(urls);
// console.log(propertyNameCounts);

let paths = svgFiles.map(file => join(root, file));
let [ nodeNameCounts, attributeNameCounts ] = await collectSvgTokensFromPaths(paths);
console.log(nodeNameCounts);
console.log(attributeNameCounts);

function waitForKey(keyCode) {
    return new Promise(resolve => {
        process.stdin.on('data',function (chunk) {
            if (chunk[0] === keyCode) {
                resolve();
                process.stdin.pause();
            }
        });
    });
}
console.log('Done, press ENTER to exit...');
await waitForKey(10);


await stopTrainingServer();
