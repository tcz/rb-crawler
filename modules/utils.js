import crypto from "crypto";

function shortId(url) {
    const hash = crypto.createHash('md5').update(url).digest('hex');
    return hash.substring(0, 8);
}

export { shortId };
