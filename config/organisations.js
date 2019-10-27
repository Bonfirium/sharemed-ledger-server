const Organization = {
	AuthOrg = "AuthOrg",
	MedOrg1 = "MedOrg1",
	MedOrg2 = "MedOrg2",
	MedOrg3 = "MedOrg3",
}

const OrganizationMSP = {
	AuthOrg = "AuthOrgMSP",
	MedOrg1 = "MedOrg1MSP",
	MedOrg2 = "MedOrg2MSP",
	MedOrg3 = "MedOrg3MSP",
}

const mspOf = {
	[Organization.AuthOrg]: OrganizationMSP.AuthOrg,
	[Organization.MedOrg1]: OrganizationMSP.MedOrg1,
	[Organization.MedOrg2]: OrganizationMSP.MedOrg2,
	[Organization.MedOrg3]: OrganizationMSP.MedOrg3,
}

const organizations = [Organization.AuthOrg, Organization.MedOrg1, Organization.MedOrg2, Organization.MedOrg3];

module.exports = {
	Organization,
	OrganizationMSP,
	mspOf,
	organizations,
};