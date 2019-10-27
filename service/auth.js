const { ok } = require('assert');
const bs58 = require('bs58');
const { randomBytes } = require('crypto');
const { empty } = require('nl-marshal');
const { Organization } = require('../config/organisations');
const { METHOD } = require('./method');
const { Fabric } = require('./utils');
const { accountId, linkApprove } = require('./types');

const userAffiliation = "org1.department1";
const doctorAffiliation = "org1.department2";

const orgAdminEnrolement = async (org) => {
	const orgAdminFabric = new Fabric(org);
    const enrollment = await orgAdminFabric.enroll("admin", "adminpw");

    orgAdminFabric.import("admin", enrollment);
    orgAdminFabric.connectGateway("admin");
    return orgAdminFabric;
}

const getAdminByOrg = async (org) => {
	const orgAdminFabric = new Fabric(org);
    orgAdminFabric.connectGateway("admin");
    return orgAdminFabric;
}

const orgUserRegistration = async (orgAdminFabric, org, affiliation) => {
    const orgUserId = bs58.encode(randomBytes(32));
	const orgUserFabric = new Fabric(org);
    
    const password = await orgAdminFabric.register(orgUserId, affiliation);
    const enrollment = await orgUserFabric.enroll(orgUserId, password);

    orgUserFabric.import(orgUserId, enrollment);
    orgUserFabric.connectGateway(orgUserId);
    const orgUserContract = await orgUserFabric.getContract();
    return { contract: orgUserContract, id: orgUserId };
}

const getOrgContractByLable = async (org, orgUserId) => {
	const orgUserFabric = new Fabric(org);
    orgUserFabric.connectGateway(orgUserId);
    const orgUserContract = await orgUserFabric.getContract();
    return { contract: orgUserContract, id: orgUserId };
}

const authOrgAdminEnrolement = () => orgAdminEnrolement(Organization.AuthOrg);
const medOrgAdminEnrolement = (medOrg) => orgAdminEnrolement(medOrg);

const authOrgUserRegistration = (orgAdminFabric) => orgUserRegistration(orgAdminFabric, Organization.AuthOrg, userAffiliation)

const medOrgUserRegistration = (medOrgAdminFabric, medOrg) => orgUserRegistration(medOrgAdminFabric, medOrg, userAffiliation)
const medOrgDoctorRegistration = (medOrgAdminFabric, medOrg) => orgUserRegistration(medOrgAdminFabric, medOrg, doctorAffiliation)

const linkUserWithOrganisation = async (medContract, authId) => {
	const request = await medContract.createTransaction(METHOD.LINK_ACCOUNT)
		.submit(accountId.stringify(authId))
		.then((res) => empty.parse(res));
	ok(request === null);
}

const approve = async (authContract, medOrgId, org) => {
	const approve = await authContract.createTransaction(METHOD.APPROVE_LINK)
		.submit(linkApprove.stringify({ organization: org, remote: medOrgId }))
		.then((res) => empty.parse(res));
	ok(approve === null);
}

const getOrigin = async (contract, medOrgId) => {
	const origin = await contract
		.evaluateTransaction(METHOD.GET_ORIGIN, accountId.stringify(medOrgId))
		.then((res) => accountId.parse(res));
	ok(accountId.toJSON(origin) === medOrgId);
	return origin;
}

module.exports = {
	orgAdminEnrolement,
	getAdminByOrg,
	orgUserRegistration,
	getOrgContractByLable,
	authOrgAdminEnrolement,
	medOrgAdminEnrolement,
	authOrgUserRegistration,
	medOrgUserRegistration,
	medOrgDoctorRegistration,
	linkUserWithOrganisation,
	approve,
	getOrigin,
};