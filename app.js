const express = require('express');
const config = require('./config.json');
const morgan = require('morgan');
const cors = require('cors')
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const uri = `mongodb+srv://${config.database.username}:${config.database.password}@cluster0.fezar.mongodb.net/${config.database.database_name}?retryWrites=true&w=majority`;
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