var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
//   initialize: function () {
//     this.on('creating', function (model, attrs, options) {
//       var username = this.get('username');
//       this.set('username', username);
//       console.log('this is : ', this);
      // model.set()
//     });
//   }
});
module.exports = User;