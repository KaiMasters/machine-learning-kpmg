const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const config = require('./config/config');

const app = express();
const server = http.createServer(app);

mongoose.Promise = global.Promise;
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost/machine-learning-kpmg';

mongoose
    .connect(mongoURI, { useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true })
    .then(data => console.log(`KPMG Challenge Initiated. Machine Learning Underway. South Korea here we come baby ;)`))
    .catch(err => console.log(`Mission failed... We'll get 'em next time`));

app.use('/', require('./server'));
