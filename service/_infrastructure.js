const FabricCAServices = require('fabric-ca-client');
const { organizations } = require('../config/organisations');

module.exports.caServicesUrl = organizations.reduce((acc, org, index) => {
	acc[org] = `https://localhost:37${index + 4}00`;
	return acc;
}, {});

module.exports.caServices = organizations.reduce((acc, organization) => {
	acc[organization] = new FabricCAServices(caServicesUrl[organization]);
	return acc;
}, {});