const express = require('express');
const router = express.Router();

router.use('/api', require('./api'));
/* GET home page. */
// router.get('/call', function(req, res, next) {
//   res.json({ title: 'Express' });
// });

// router.get('/exec', function(req, res, next) {
//   res.json({ title: 'Express' });
// });

module.exports = router;