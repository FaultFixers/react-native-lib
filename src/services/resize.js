const fs = require('fs');
const sharp = require('sharp');
const md5 = require('md5');
const http = require('http');
const https = require('https');
const {promisify} = require('util');
const exists = promisify(fs.exists);

async function download(url, path) {
    const pathExists = await exists(path);
    if (pathExists) {
        console.info('File already exists, not re-downloading:', url, path);
        return;
    }

    console.info('Downloading ' + url + ' to ' + path);

    const file = fs.createWriteStream(path);

    return new Promise((resolve, reject) => {
        const get = (url.indexOf('http:') === 0 ? http.get : https.get);
        get(url, function(response) {
            response.pipe(file);
            file.on('finish', function() {
                file.close(resolve);
            });
        }).on('error', function(err) { // Handle errors
            fs.unlink(path);
            reject(err);
        });
    });
}

async function resize(url, width, height, format = 'png') {
    if (!width) {
        throw new Error('No width given');
    }
    if (!height) {
        throw new Error('No height given');
    }

    const path = '/tmp/favicon-' + md5(url) + '-' + width + 'x' + height + '.' + format;

    await download(url, path);

    const readStream = fs.createReadStream(path);

    let transform = sharp();
    transform = transform.toFormat(format);
    transform = transform.resize(width, height);

    return readStream.pipe(transform);
}

module.exports = resize;
