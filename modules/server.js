import express from "express";
import {dirname, join, resolve} from "path";
import {fileURLToPath} from "url";
import fs from 'fs';

let server;

async function startWebServer() {
    const app = express();

    const root = resolve(join(dirname(fileURLToPath(import.meta.url)), '../storage/key_value_stores/default'));
    app.use(express.static(root));

    app.get('/side-by-side', (req, res) => {
        const files = fs.readdirSync(root)
            .filter(file => file.endsWith('-bitmap.png') || file.endsWith('-screenshot.png'))
            .sort();

        let html = '<html><body><table>';
        for (let i = 0; i < files.length; i++) {
            html += '<tr>';
            if (!files[i].endsWith('-bitmap.png')) {
                html += `<td></td>`;
            }
            html += `<td><img src="${files[i]}" style="width: 50%; height: auto; display: block;"></td>`;
            if (files[i].endsWith('-bitmap.png')) {
                if (i + 1 < files.length && files[i + 1].endsWith('-screenshot.png')) {
                    i++;
                    html += `<td><img src="${files[i]}" style="width: 50%; height: auto; display: block;"></td>`;
                } else {
                    html += `<td></td>`;
                }
            }
            html += '</tr>';
        }

        html += '</table></body></html>';

        res.send(html);
    });

    const PORT = 3000;

    server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT} with root ${root}.`);
    });
}

async function stopWebServer() {
    if (server) {
        console.log('Stopping server...');
        return server.close(() => {
            console.log('Server stopped');
        });
    }
}

export { startWebServer, stopWebServer };
