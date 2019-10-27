const FabricCAServices = require('fabric-ca-client');
const { organizations } = require('../config/organisations');

const caServicesUrl = organizations.reduce((acc, org, index) => {
	acc[org] = `https://localhost:37${index + 4}00`;
	return acc;
}, {});

const caServices = organizations.reduce((acc, organization) => {
	acc[organization] = new FabricCAServices(caServicesUrl[organization]);
	return acc;
}, {});

module.exports = {
	caServicesUrl,
	caServices,
}