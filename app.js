const express = require('express');
const dbConfig = require('./config/db.config.json');
const morgan = require('morgan');
const cors = require('cors')
const mongoose = require('mongoose');
const httpStatus=require('http-status');
const ApiError=require('./utils/ApiError')
require('dotenv').config()
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

require('./middlewares/routes.mdw')(app);

app.get('/err', function (req, res) {
  throw new ApiError(httpStatus.NOT_FOUND,'Error!');
})

app.use(function (req, res, next) {
  res.status(httpStatus.NOT_FOUND).json({
    message: 'RESOURCE NOT FOOUND'
  });
});

app.use(function (err, req, res, next) {
  if (err instanceof ApiError) {
    let statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    let message = err.message || 'SOMETHING BROKEN';
    return res.status(statusCode).json({
        error_message:message
    });
  }
  return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
    error_message: err.message || 'SOMETHING BROKEN'
  });
})

const uri = `mongodb+srv://${dbConfig.database.username}:${dbConfig.database.password}@cluster0.fezar.mongodb.net/${dbConfig.database.database_name}?retryWrites=true&w=majority`;
mongoose
    .connect(
        uri,
        { useNewUrlParser: true, useUnifiedTopology: true }
    )
    .then(() => {
        console.log('Connect Mongodb Successfully');
    })
    .catch((error) => console.log(error));
    
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {    
    console.log(`Server is running on PORT ${PORT}`);
});

