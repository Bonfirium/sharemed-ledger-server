const { readFile } = require('fs-extra');
const path = require('path');
const { Organization, mspOf, organizations } = require('fs-extra');

const { Organization, mspOf, organizations } = require('../config/organisations');

const rootPath = path.resolve(__dirname, '../');

const anchorPeerOf = {
	[Organization.AuthOrg]: "peer0.auth-org.sharemed-ledger.io",
	[Organization.MedOrg1]: "peer0.med-org1.sharemed-ledger.io",
	[Organization.MedOrg2]: "peer0.med-org2.sharemed-ledger.io",
	[Organization.MedOrg3]: "peer0.med-org3.sharemed-ledger.io",
};

const caOf = {
	[Organization.AuthOrg]: "ca.auth-org.sharemed-ledger.io",
	[Organization.MedOrg1]: "ca.med-org1.sharemed-ledger.io",
	[Organization.MedOrg2]: "ca.med-org2.sharemed-ledger.io",
	[Organization.MedOrg3]: "ca.med-org3.sharemed-ledger.io",
};

const ordererId = 'orderer.sharemed-ledger.io';

function checkCertificatePEM(str) {
	if (!str.startsWith('-----BEGIN CERTIFICATE-----')) throw new Error('invalid certificate format');
}

const peersSettings = {
	[anchorPeerOf[Organization.AuthOrg]]: { url: "grpcs://localhost:37397" },
	[anchorPeerOf[Organization.MedOrg1]]: { url: "grpcs://localhost:37497" },
	[anchorPeerOf[Organization.MedOrg2]]: { url: "grpcs://localhost:37597" },
	[anchorPeerOf[Organization.MedOrg3]]: { url: "grpcs://localhost:37697" },
};

function getTlsOfPeer(orgShort) {
	return [
		"crypto-config/peerOrganizations",
		`${orgShort}.sharemed-ledger.io`,
		"tlsca",
		`tlsca.${orgShort}.sharemed-ledger.io-cert.pem`,
	].join("/");
}

const anchorPeerTlsPemOfOrganization = {
	[Organization.AuthOrg]: getTlsOfPeer("auth-org"),
	[Organization.MedOrg1]: getTlsOfPeer("med-org1"),
	[Organization.MedOrg2]: getTlsOfPeer("med-org2"),
	[Organization.MedOrg3]: getTlsOfPeer("med-org3"),
};

const orderersSettings = {
	[ordererId]: { url: "grpcs://localhost:37297" },
};

const ordererTlsca = "crypto-config/ordererOrganizations/sharemed-ledger.io/tlsca/tlsca.sharemed-ledger.io-cert.pem";

async function loadCertificates() {
	await Promise.all([
		...organizations.map(async (org) => {
			const peer = peersSettings[anchorPeerOf[org]];
			if (peer.tlsCACerts) return checkCertificatePEM(peer.tlsCACerts.pem);
			peer.tlsCACerts = {
				pem: await readFile(path.resolve(rootPath, anchorPeerTlsPemOfOrganization[org]), 'utf8'),
			};
			peer.grpcOptions = {
				"ssl-target-name-override": anchorPeerOf[org],
				hostnameOverride: anchorPeerOf[org],
			};
		}),
		Promise.resolve().then(async () => {
			const orderer = orderersSettings[ordererId];
			if (orderer.tlsCACerts) return checkCertificatePEM(orderer.tlsCACerts.pem);
			orderer.tlsCACerts = { pem: await readFile(path.resolve(rootPath, ordererTlsca), 'utf8') };
			orderer.grpcOptions = {
				"ssl-target-name-override": ordererId,
				hostnameOverride: ordererId,
			};
		}),
	]);
}

function getConnectionSettings(organization) {
	return {
		name: 'network',
		version: '1.0.0',
		client: {
			organization,
			connection: {
				timeout: { peer: { endorser: "300" }, orderer: "300" },
			},
		},
		channels: {
			mainchannel: {
				orderers: [ordererId],
				peers: {
					[anchorPeerOf[Organization.AuthOrg]]: {},
					[anchorPeerOf[Organization.MedOrg1]]: {},
					[anchorPeerOf[Organization.MedOrg2]]: {},
					[anchorPeerOf[Organization.MedOrg3]]: {},
				},
			},
		},
		organizations: {
			[Organization.AuthOrg]: {
				mspid: mspOf[Organization.AuthOrg],
				peers: [anchorPeerOf[Organization.AuthOrg]],
				certificateAuthorities: [caOf[Organization.AuthOrg]],
			},
			[Organization.MedOrg1]: {
				mspid: mspOf[Organization.MedOrg1],
				peers: [anchorPeerOf[Organization.MedOrg1]],
				certificateAuthorities: [caOf[Organization.MedOrg1]],
			},
			[Organization.MedOrg2]: {
				mspid: mspOf[Organization.MedOrg2],
				peers: [anchorPeerOf[Organization.MedOrg2]],
				certificateAuthorities: [caOf[Organization.MedOrg2]],
			},
			[Organization.MedOrg3]: {
				mspid: mspOf[Organization.MedOrg3],
				peers: [anchorPeerOf[Organization.MedOrg3]],
				certificateAuthorities: [caOf[Organization.MedOrg3]],
			},
		},
		orderers: orderersSettings,
		peers: peersSettings,
		certificateAuthorities: {
			[caOf[Organization.AuthOrg]]: { url: "https://localhost:37400", caName: caOf[Organization.AuthOrg] },
			[caOf[Organization.MedOrg1]]: { url: "https://localhost:37500", caName: caOf[Organization.MedOrg1] },
			[caOf[Organization.MedOrg2]]: { url: "https://localhost:37600", caName: caOf[Organization.MedOrg2] },
			[caOf[Organization.MedOrg3]]: { url: "https://localhost:37700", caName: caOf[Organization.MedOrg3] },
		},
	};
}

module.exports = {
	getConnectionSettings,
	loadCertificates,
};