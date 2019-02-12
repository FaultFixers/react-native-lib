window.doApiRequest = function(method, path, config, success, error) {
    config.method = method;
    config.url = window.API_BASE_URL + path;
    config.success = success;
    config.error = error;
    config.headers = {
        'Accept': 'application/vnd.faultfixers.v9+json',
        'X-FF-SessionId': window.sessionId,
        'X-FF-DeviceId': window.deviceId,
        'X-FF-ApiClient': 'REPORTER_WEB',
    };

    if (window.API_AUTHORIZATION) {
        config.headers['Authorization'] = window.API_AUTHORIZATION;
    }

    $.ajax(config);
};

window.doApiFileUpload = function(file, success, error) {
    if (!file) {
        throw new Error('Not given a file');
    }

    const postData = new FormData();
    postData.append('file', file);

    const config = {
        data: postData,
        cache: false,
        contentType: false,
        processData: false,
        enctype: 'multipart/form-data',
    };
    doApiRequest('POST', '/files', config, success, error);
};

window.doApiPostRequest = function(path, data, success, error) {
    const config = {
        data: JSON.stringify(data),
        contentType: 'application/json; charset=utf-8',
    };
    doApiRequest('POST', path, config, success, error);
};

window.doApiPutRequest = function(path, data, success, error) {
    const config = {
        data: JSON.stringify(data),
        contentType: 'application/json; charset=utf-8',
    };
    doApiRequest('PUT', path, config, success, error);
};
