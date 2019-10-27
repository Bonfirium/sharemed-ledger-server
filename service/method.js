const { ok } = require('assert');
const { Contract } = require('fabric-contract-api');
const { empty, chars, varuint, BigNumber } = require('nl-marshal');

const { Organization, mspOf, collectionOfMSP } = require('./organizations');
const { linkApprove, accountId, accountLink, addDocumentRequest, document, collectionDocument } = require('./types');

const METHOD = {
	GET_DOCUMENTS_COUNT = "getDocumentsCount",
	GET_USER_ID = "getUserId",
	GET_ORIGIN = "getOrigin",
	LINK_ACCOUNT = "linkAccount",
	APPROVE_LINK = "approveLink",
	ADD_DOCUMENT = "addDocument",
}

const args = {
	[METHOD.GET_DOCUMENTS_COUNT]: empty,
	[METHOD.GET_USER_ID]: empty,
	[METHOD.GET_ORIGIN]: accountId,
	[METHOD.LINK_ACCOUNT]: accountId,
	[METHOD.APPROVE_LINK]: linkApprove,
	[METHOD.ADD_DOCUMENT]: addDocumentRequest,
};


const outputs = {
	[METHOD.GET_DOCUMENTS_COUNT]: varuint,
	[METHOD.GET_USER_ID]: chars,
	[METHOD.GET_ORIGIN]: accountId,
	[METHOD.LINK_ACCOUNT]: empty,
	[METHOD.APPROVE_LINK]: empty,
	[METHOD.ADD_DOCUMENT]: varuint,
};


const KEY = {
	LINK_ACCOUNT: (msp, remote) => `LINK_${msp}_${remote}`,
	DOCUMENTS_COUNT: "DOCUMENTS_COUNT",
	DOCUMENT: (key) => `DOCUMENT_${key.toString(10)}`,
};

const doctorOrgUnit = "department2";

class ShareMedLedgerContract extends Contract {
	constructor() { super('io.sharemed-ledger.contract'); }
	async _exec(
		ctx,
		method,
		arg,
	) {
		const input_t = args[method];
		const input_s = input_t.stringify(arg);
		const output_s = await this[method](ctx, input_s);
		const output_t = outputs[method];
		return output_t.parse(output_s);
	}

	async [METHOD.GET_DOCUMENTS_COUNT](ctx) {
		const result_b = await ctx.stub.getState(KEY.DOCUMENTS_COUNT);
		const result = result_b === undefined || result_b.length === 0 ?
			new BigNumber(0) : varuint.fromBuffer(result_b);
		return outputs[METHOD.GET_DOCUMENTS_COUNT].stringify(result);
	}

	async [METHOD.GET_USER_ID](ctx) {
		return chars.stringify(ctx.clientIdentity.getX509Certificate().subject.commonName);
	}

	async [METHOD.GET_ORIGIN](ctx, input) {
		const remote = accountId.parse(input);
		const organization = ctx.clientIdentity.getMSPID();
		ok(organization !== Organization.AuthOrg);
		const remote_j = accountId.toJSON(remote);
		const request_b = await ctx.stub.getState(KEY.LINK_ACCOUNT(organization, remote_j));
		const x509 = ctx.clientIdentity.getX509Certificate();
		ok(x509.subject.commonName === remote_j || x509.subject.organizationalUnitName === doctorOrgUnit);
		ok(request_b !== undefined && request_b.length !== 0, "account link not found");
		const { origin, approved } = accountLink.fromBuffer(request_b);
		ok(approved);
		return accountId.stringify(origin);
	}

	async [METHOD.LINK_ACCOUNT](ctx, input) {
		const origin = accountId.parse(input);
		const msp = ctx.clientIdentity.getMSPID();
		const remote = accountId.fromJSON(ctx.clientIdentity.getX509Certificate().subject.commonName);
		ok(msp !== mspOf[Organization.AuthOrg], `organization ${Organization.AuthOrg} unable to link accounts`);
		await ctx.stub.putState(KEY.LINK_ACCOUNT(msp, accountId.toJSON(remote)), accountLink.toBuffer({
			origin, approved: false,
		}));
		return empty.stringify(null);
	}

	async [METHOD.APPROVE_LINK](ctx, input) {
		const { organization, remote } = linkApprove.parse(input);
		const origin = accountId.fromJSON(ctx.clientIdentity.getX509Certificate().subject.commonName);
		const byOrg = ctx.clientIdentity.getMSPID();
		ok(byOrg === mspOf[Organization.AuthOrg], `expected organization AuthOrg, but actual msp is ${byOrg}`);
		ok(Object.keys(mspOf).includes(organization), `unknown organization ${organization}`);
		ok(organization !== Organization.AuthOrg, `unable to approve AuthOrg links`);
		const key = KEY.LINK_ACCOUNT(mspOf[organization], accountId.toJSON(remote));
		const request_b = await ctx.stub.getState(key);
		ok(request_b !== undefined && request_b.length !== 0, "request is not exists");
		const { origin: originLink, approved } = accountLink.fromBuffer(request_b);
		ok(!approved, "request is already approved");
		const origin_j = accountId.toJSON(origin);
		ok(origin.equals(originLink), `origin ${origin_j} not equals to expected ${accountId.toJSON(originLink)}`);
		await ctx.stub.putState(key, accountLink.toBuffer({ origin, approved: true }));
		return empty.stringify(null);
	}

	async [METHOD.ADD_DOCUMENT](ctx, input) {
		const { accountId, cipherKey, hash } = addDocumentRequest.parse(input);
		const msp = ctx.clientIdentity.getMSPID();
		ok(msp !== mspOf[Organization.AuthOrg]);
		const [origin, documentsCount] = await Promise.all([
			this._exec(ctx, METHOD.GET_ORIGIN, accountId),
			this._exec(ctx, METHOD.GET_DOCUMENTS_COUNT, null),
		]);
		const collection = collectionOfMSP[msp];
		if (collection === null) throw new Error(`unable to get collection of ${msp}`);
		const collectionBuffer = collectionDocument.toBuffer({ hash, cipherKey });
		await Promise.all([
			ctx.stub.putState(KEY.DOCUMENT(documentsCount), document.toBuffer({ accountId: origin, ownerMSP: msp })),
			ctx.stub.putState(KEY.DOCUMENTS_COUNT, varuint.toBuffer(documentsCount.plus(1))),
			ctx.stub.putPrivateData(collection, KEY.DOCUMENT(documentsCount), collectionBuffer),
		]);
		return outputs[METHOD.ADD_DOCUMENT].stringify(documentsCount);
	}
}

module.exports = {
	METHOD,
	args,
	outputs,
	dafault: ShareMedLedgerContract,
};