// const tf = require('@tensorflow/tfjs-node');
// const kNNClassifier = require('@tensorflow-models/knn-classifier');
const occupations = require('./rawData/occupations');
const interests = require('./rawData/interests');
const products = require('./rawData/products');
const Product = require('../server/product/productModel');
const Profile = require('../server/profile/profileModel');

class MachineLearner {
  constructor() {
    this.occupationMatrix = {};
    this.interestMatrix = {};
    this.productMatrix = {};
    this.myProfile = null;
    this._dummyEncode(occupations, this.occupationMatrix);
    this._dummyEncode(interests, this.interestMatrix);
    this._labelEncode(products, this.productMatrix);

    this.printConversionMatrix = this.printConversionMatrix.bind(this);
  }

  printConversionMatrix(type) {
    switch (type) {
      case "occupation":
        return JSON.stringify(this.occupationMatrix);
      case "interests":
        return JSON.stringify(this.interestMatrix);
      case "products":
        return JSON.stringify(this.productMatrix, null, ' ')
    }
  }

  _dummyEncode(array, output) {
    for (let type = 0; type < array.length; type++) {
      const stringType = array[type];
      const matrixEntry = output[stringType] = new Array(array.length);

      for (let i = 0; i < array.length; i++) {
        matrixEntry[i] = (i === type) ? 1 : 0;
      }
    }
  };

  _labelEncode(objectArray, output) {
    let brandTracker = {};
    let brandClass = 0;

    let productTracker = {};
    let productClass = 0;

    let categoryTracker = {};
    let categoryClass = 0;

    let departmentTracker = {};
    let departmentClass = 0;

    for (let row = 0; row < objectArray.length; row++) {
      const brandItem = objectArray[row].Brand.toLowerCase();
      const productItem = objectArray[row].Product.toLowerCase();
      const categoryItem = objectArray[row].Category.toLowerCase();
      const departmentItem = objectArray[row].Department.toLowerCase();

      output.brand = brandTracker;
      output.product = productTracker;
      output.category = categoryTracker;
      output.department = departmentTracker;

      if (!output.brand[brandItem]) {
        brandClass += 1;
        output.brand[brandItem] = brandClass;
      }
      if (!output.product[productItem]) {
        productClass += 1;
        output.product[productItem] = productClass;
      }
      if (!output.category[categoryItem]) {
        categoryClass += 1;
        output.category[categoryItem] = categoryClass;
      }
      if (!output.department[departmentItem]) {
        departmentClass += 1;
        output.department[departmentItem] = departmentClass;
      }
    }
    return output;
  };

  /**
   * Calculates the cosine angle between two vectors, giving a similarity metric
   * @param vec1 tf.tensor of a user + product data
   * @param vec2 tf.tensor of another user + product data
   * @returns {number} -1 <= number <= 1 (cosine of the vectors)
   */
  _calcSimilarity(vec1, vec2) {
    return (vec1.dot(vec2).arraySync())
      / (Math.sqrt(vec1.square().sum().arraySync()) * Math.sqrt(vec2.square().sum().arraySync()));
  }

  _convertToNumericalMatrix(user) {
    const convertedOccupation = this.occupationMatrix[user.occupation];
    let convertedInterests = new Array(interests.length).fill(0);
    user.interests.forEach(interest => {
      const indexOfOne = this.interestMatrix[interest].findIndex(1);
      convertedInterests[indexOfOne] = 1;
    });
    let convertedProducts = [];
    user.purchases.forEach(product => {
      convertedProducts.push(this.productMatrix['brand'][product.brand]);
      convertedProducts.push(this.productMatrix['product'][product.product]);
      convertedProducts.push(this.productMatrix['category'][product.category]);
      convertedProducts.push(this.productMatrix['department'][product.department]);
    });
    return convertedOccupation.concat(convertedInterests).concat(convertedProducts);
  }

  predict(itemID) {
    let myProfile = null;
    Profile.findById("5dc9407ca6aca9469c8559b7", (err, foundProfile) => {
      if (err) {
        console.log(`Mongo experienced an error retrieving my profile. Error: ${err}`);
      }
      myProfile = foundProfile;
    });

    let productToDetermine = null;
    Product.findById(itemId, (err, foundProduct) => {
      if (err) {
        console.log(`Mongo experienced an error retrieving product with id: ${itemID}. Error: ${err}`);
      }
      productToDetermine = foundProduct;
    });

    Profile.find({})
      .populate('purchases')
      .exec()
      .then(allProfiles => {
        // 1. Grab all profiles
        // 2. convert each profile to its associated numerical vector
        // 3. For each other user compared with myProfile:
        //        calculate similarity between users
        // 4. Keep running sum of similarities to other users who have bought the product
        // 5. If other user has purchased product that my profile hasn't, then attach a 1 as the weight, 0 otherwise
      })
      .catch(err => console.log(`Mongo experienced an error retrieving all profiles for recommendations. Error: ${err}`))
  }
}

module.exports = new MachineLearner();