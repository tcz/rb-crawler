import express from "express";
import {dirname, join, resolve} from "path";
import {fileURLToPath} from "url";
import fs from 'fs';

let server;

async function startTrainingServer() {
    const app = express();

    const root = resolve(join(dirname(fileURLToPath(import.meta.url)), 'data'));
    app.use(express.static(root));

    app.get('/css-html/:cssFileName', (req, res) => {
        const cssFileName = req.params.cssFileName;

        let html = '<body><style>';
        html += fs.readFileSync(join(root, cssFileName), 'utf8');
        html += '</style></body>';

        res.send(html);
    });

    const PORT = 3001;

    server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT} with root ${root}.`);
    });
}

async function stopTrainingServer() {
    if (server) {
        console.log('Stopping server...');
        return server.close(() => {
            console.log('Server stopped');
        });
    }
}

export { startTrainingServer, stopTrainingServer };
