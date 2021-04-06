'use strict';

module.exports = (capability) => {

  return (req, res, next) => {

    try {
      if (req.user.capabilities.includes(capability)) {
        // console.log(req.user.capabilities,"00000000000000000000")
        next();
      }
      else {
        next('Access Denied');
      }
    } catch (e) {
      next('Invalid Login');
    }

  }

}
