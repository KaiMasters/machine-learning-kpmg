const tf = require('@tensorflow/tfjs-node');
const kNNClassifier = require('@tensorflow-models/knn-classifier');
const convertInputData = require('./inputConverter');

class MachineLearner {
  constructor() {
    this.updateClassifier = this.updateClassifier.bind(this);
    this.converter = convertInputData();
  }


  updateClassifier(examples, labels) {

  }

  _convertExample(example, label) {

  }
}

module.exports = new MachineLearner();