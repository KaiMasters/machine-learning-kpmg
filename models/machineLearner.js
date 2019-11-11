const tf = require('@tensorflow/tfjs-node');
const kNNClassifier = require('@tensorflow-models/knn-classifier');

class MachineLearner {
  constructor() {
    this.classifier = kNNClassifier.create();

    this.updateClassifier = this.updateClassifier.bind(this);
  }

  updateClassifier(examples, labels) {

  }

  _convertExample(example, label) {

  }
}

module.exports = new MachineLearner();