  module.exports = (app) => {
    app.use('/users', require('../routes/user/user.route'));
    app.use('/categories', require('../routes/user/category.route'));
  };