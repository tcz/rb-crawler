import express from "express";
import {dirname, join, resolve} from "path";
import {fileURLToPath} from "url";

let server;

async function startWebServer() {
    const app = express();

    const root = resolve(join(dirname(fileURLToPath(import.meta.url)), '../storage/key_value_stores/default'));
    app.use(express.static(root));

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
