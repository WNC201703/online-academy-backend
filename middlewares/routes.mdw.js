  module.exports = (app) => {
    app.use('/user/auth', require('../routes/user/auth.route'));
    // app.use('/admin/auth', require('../routes/admin/auth.route'));   
  };