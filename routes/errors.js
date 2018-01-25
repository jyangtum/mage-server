module.exports = function(app, security) {
  var Error = require('../models/error');

  var passport = security.authentication.passport;
  app.all('/api/errors*', passport.authenticate('bearer'));

  app.get(
    '/api/errors',
    function (req, res, next) {
      Error.getErrors(function (err, errors) {
        if (err) return next(err);

        res.json(errors);
      });
    }
  );

  app.post(
    '/api/errors',
    function(req, res, next) {
      Error.createError(req.body, function(err, error) {
        if (err) return next(err);

        res.location(error._id.toString()).json(error);
      });
    }
  );
};
