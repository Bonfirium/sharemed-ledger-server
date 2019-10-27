const express = require('express');
const router = express.Router();

router.use('/users', require('./users'));
router.use('/chaincode', require('./chaincode'));

module.exports = router;