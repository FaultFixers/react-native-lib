const api = require('./api');

async function getActiveBuildings(req, res) {
    const domain = req.hostname;
    const response = await api.asIntegration().get(`/reporting-websites/${domain}/buildings`);

    if (response.statusCode !== 200) {
        throw new Error(`Could not get buildings for ${domain}`);
    }

    return response.json.results
        .map(result => result.building)
        .filter(building => building.status === 'ACTIVE')
        .sort((a, b) => a.name.localeCompare(b.name));
}

// async function getActiveBuildingById(req, id) {
//     const response = await api.get(req, `/buildings/${id}?includeTickets=true&includeLocations=true`);
//     if (response.statusCode !== 200) {
//         throw new Error(`This building does not exist`);
//     }

//     const json = response.json;
//     if (json.building.status !== 'ACTIVE') {
//         throw new Error('The building ' + json.building.name + ' is not active');
//     }

//     return json;
// }

module.exports = {
    getActiveBuildings,
//     getActiveBuildingById,
};
