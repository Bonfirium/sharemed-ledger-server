const { FileSystemWallet, X509WalletMixin, Gateway } = require('fabric-network');
const { mkdir, mkdirp } = require('fs-extra');
const path = require('path');
const { default: rimrafWithCb } = require('rimraf');
const { caServices } = require('./_infrastructure');
const { getConnectionSettings } = require('./_connectionSettings');
const { mspOf } = require('../config/organisations');


async function rimraf(path) {
	await new Promise((resolve, reject) => rimrafWithCb(path, (error) => {
		if (error !== null) return reject(error);
		resolve();
	}));
}

const walletsPath = path.resolve(__dirname, "wallets");

async function clearWallets() {
	await rimraf(walletsPath);
	await mkdirp(walletsPath);
}

class Fabric {

	constructor(organization) {
		this._gateway = new Gateway();
		this.walletsCount = 0;
        this.organization = organization;
		this.walletPath = path.resolve(walletsPath, Fabric.walletsCount.toString(10));
		Fabric.walletsCount += 1;
		this.wallet = new FileSystemWallet(this.walletPath);
	}

	async init() {
		await rimraf(this.walletPath);
		await mkdir(this.walletPath);
	}

	async exists(label) { return await this.wallet.exists(label); }

	async enroll(enrollmentID, enrollmentSecret) {
		return await caServices[this.organization].enroll({ enrollmentID, enrollmentSecret, profile: "tls" });
	}

	async import(label, enrollment) {
		const msp = mspOf[this.organization];
		const identity = X509WalletMixin.createIdentity(msp, enrollment.certificate, enrollment.key.toBytes());
		await this.wallet.import(label, identity);
	}

	async connectGateway(label) {
		const gatewaySettings = {
			wallet: this.wallet,
			identity: label,
			discovery: { enabled: false },
		};
		const clientConfig = getConnectionSettings(this.organization);
		// console.log(inspect(clientConfig, false, null, true));
		await this._gateway.connect(clientConfig, gatewaySettings);
	}

	async getContract() {
		const network = await this._gateway.getNetwork("mainchannel");
		return network.getContract("sharemedchaincode");
	}

	async register(userId, affiliation) {
		const adminIdentity = this._gateway.getCurrentIdentity();
		return await caServices[this.organization].register(
			{ affiliation, enrollmentID: userId, role: 'client' },
			adminIdentity,
		);
	}
}

module.exports = {
	rimraf,
	clearWallets,
	Fabric,
};