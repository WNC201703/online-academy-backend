  module.exports = (app) => {
    app.use('/users', require('../routes/user/user.route'));
  };