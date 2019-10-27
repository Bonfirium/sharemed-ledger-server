const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');

//GET current route (required, only authenticated users have access)
router.post('/call', auth.required, (req, res, next) => {
  const { payload: { id }, organisation, params } = req;

  return Users.findById(id)
    .then((user) => {
      if(!user) {
        return res.sendStatus(400);
      }

      return res.json({ user: user.toAuthJSON() });
    });
});

router.post('/call', auth.required, (req, res, next) => {
    const { payload: { id }, organisation, params } = req;
  
    return Users.findById(id)
      .then((user) => {
        if(!user) {
          return res.sendStatus(400);
        }
  
        return res.json({ user: user.toAuthJSON() });
      });
  });

module.exports = router;