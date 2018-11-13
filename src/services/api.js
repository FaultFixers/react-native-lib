const https = require('https');
const config = require('../../config/load.js');

function doRequest(authorization, method, path, bodyData = null) {
    if (!path.startsWith('/')) {
        throw new Error('Path must start with /');
    }

    const isPostOrPut = () => method === 'POST' || method === 'PUT';

    return new Promise(function(resolve, reject) {
        const options = {
            hostname: config.apiHostname,
            path: path,
            method: method,
            headers: {
                'Accept': 'application/vnd.faultfixers.v5+json',
                'User-Agent': 'FaultFixers Reporting Websites',
            },
        };

        if (authorization) {
            options.headers['Authorization'] = authorization;
        }

        console.debug('Making API request', {method, path, auth: options.headers['Authorization']});

        if (isPostOrPut() && bodyData) {
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = JSON.stringify(bodyData).length;
        }

        const request = https.request(
            options,
            function (res) {
                let jsonString = '';
                res.on('data', data => jsonString += data);
                res.on('end', () => {
                    const result = {
                        statusCode: res.statusCode,
                        headers: res.headers,
                    };
                    if (jsonString) {
                        let json;
                        try {
                            json = JSON.parse(jsonString);
                        } catch (e) {
                            console.error('Response body is not valid JSON:', jsonString);
                            throw e;
                        }
                        result.json = json;
                    }

                    console.debug('Got status code ' + res.statusCode + ': ' + jsonString.substring(0, 50) + '...');

                    if (res.statusCode >= 200 && res.statusCode <= 399) {
                        resolve(result);
                    } else {
                        reject(result);
                    }
                });
            })
            .on('error', (error) => {
                reject(error);
            });

        if (isPostOrPut() && bodyData) {
            request.write(JSON.stringify(bodyData));
        }

        request.end();
    });
}

function wrapApi(authorization) {
    return {
        get: (path) => doRequest(authorization, 'GET', path),
        post: (path, bodyData) => doRequest(authorization, 'POST', path, bodyData),
        put: (path, bodyData) => doRequest(authorization, 'PUT', path, bodyData),
    };
}

function asIntegration() {
    return wrapApi('Integration ' + config.apiKey);
}

function asUser(originalReq) {
    if (originalReq.cookies.authToken) {
        return wrapApi('User ' + originalReq.cookies.authToken);
    } else {
        throw new Error('No auth token in original request');
    }
}

function withoutAuth() {
    return wrapApi(null);
}

module.exports = {
    asIntegration,
    asUser,
    withoutAuth,
};
