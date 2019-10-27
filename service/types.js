const { bytes, Encoding, struct, chars, bool, extended, optional } = require('nl-marshal');

const accountId = bytes({ encoding: Encoding.BASE_58, length: 32 });
const linkApprove = struct({ organization: chars, remote: accountId });
const accountLink = struct({ origin: accountId, approved: bool });
const addDocumentRequest = struct({
	accountId,
	hash: bytes({ encoding: Encoding.BASE_58, length: 34 }),
	cipherKey: bytes({ encoding: Encoding.BASE_58, length: 24 }),
});
const document_t = struct({ accountId, ownerMSP: chars });
const collectionDocument = struct({
	hash: addDocumentRequest.serializers.hash,
	cipherKey: addDocumentRequest.serializers.cipherKey,
});
const documentResult = extended(document_t, { collection: optional(collectionDocument) });

module.exports = {
	accountId,
	linkApprove,
	accountLink,
	addDocumentRequest,
	document_t,
	collectionDocument,
	documentResult,
};