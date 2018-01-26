var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ErrorSchema = new Schema({
  error: {}
});

var Error = mongoose.model('Error', ErrorSchema);

exports.getErrors = function(callback) {
  Error.find({}, function (err, errors) {
    callback(err, errors);
  });
};

exports.createError = function(error, callback) {  
  Error.create({error: error}, function(err, newError) {
    if (err) return callback(err);

    callback(err, newError);
  });
};
