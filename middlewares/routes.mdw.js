  module.exports = (app) => {
    app.use('/users', require('../routes/user.route'));
    app.use('/categories', require('../routes/category.route'));
  };