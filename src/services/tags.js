// const api = require('./api');

// async function getTag(req, idOrCode) {
//     const response = await api.get(req, `/tags/${idOrCode}`);
//     if (response.statusCode !== 200) {
//         throw new Error(`Code "${idOrCode}" is invalid`);
//     }

//     const json = response.json;
//     const tag = json.tag;
//     tag.account = json.account;
//     return tag;
// }

// module.exports = {
//     getTag,
// };
