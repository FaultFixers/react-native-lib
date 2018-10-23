console.log('Config env: ' + process.env.FF_ENV);
module.exports = require('./' + process.env.FF_ENV + '.js');
