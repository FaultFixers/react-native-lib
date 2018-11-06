const api = require('./api');

// @todo - replace
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

module.exports = {
    getActiveBuildings,
};
