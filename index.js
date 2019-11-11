const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const config = require('./config/config');
const MachineLearner = require('./models/machineLearner');

const app = express();
const server = http.createServer(app);

mongoose.Promise = global.Promise;
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost/machine-learning-kpmg';

mongoose
  .connect(mongoURI, {useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true, useUnifiedTopology: true})
  .then(data => {
    console.log(`KPMG Challenge Initiated. Machine Learning Underway. South Korea here we come baby ;)`);
    MachineLearner.recommend("5dc9407ca6aca9469c8559b7")
      .then(data => console.log("We IN DIS"))
      .catch(err => console.log(`Error occurred: ${err}`));
  })
  .catch(err => console.log(`Mission failed... Could not connect to the database. We'll get 'em next time: ${err}`));

app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use('/', require('./server/server'));

app.use('*', (req, res) => {
  res.status(404).send('Hey look! You discovered a route that doesn\'t work!');
});

app.use((err, req, res, next) => {
  console.log('Global error handler called in index.js!');
  console.log(`Err: ${JSON.stringify(err, null, ' ')}`);
  console.log(`Error message: ${err.message}`);
  console.error(err.stack);
  res.status(500).send(err.message);

});

const {PORT} = config;
server.listen(PORT);
console.log(`Server listening on port ${PORT}`);
// console.log(`Occupation Matrix: ${MachineLearner.printConversionMatrix('occupation')}`);
// console.log(`Interest Matrix: ${MachineLearner.printConversionMatrix('interests')}`);
// console.log(`Product Matrix: ${MachineLearner.printConversionMatrix('products')}`);