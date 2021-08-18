  module.exports = (app) => {
    app.use('/api-docs', require('../routes/apidocs.route'));
    app.use('/api/users', require('../routes/user.route'));
    app.use('/api/categories', require('../routes/category.route'));
    app.use('/api/courses', require('../routes/course.route'));
    app.use('/api/teachers', require('../routes/teacher.route'));
  };