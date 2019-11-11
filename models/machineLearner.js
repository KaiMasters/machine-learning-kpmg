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
    this._convertToNumericalMatrix = this._convertToNumericalMatrix.bind(this);
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
      const brandItem = objectArray[row].brand.toLowerCase();
      const productItem = objectArray[row].product.toLowerCase();
      const categoryItem = objectArray[row].category.toLowerCase();
      const departmentItem = objectArray[row].department.toLowerCase();

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
      const indexOfOne = this.interestMatrix[interest].indexOf(1);
      convertedInterests[indexOfOne] = 1;
    });
    let convertedProducts = [];
    user.purchases.forEach(product => {
      const convProduct = product.toObject();
      convertedProducts.push(this.productMatrix['brand'][convProduct.Brand.toLowerCase()]);
      convertedProducts.push(this.productMatrix['product'][convProduct.Product.toLowerCase().trim().toString()]);
      convertedProducts.push(this.productMatrix['category'][convProduct.Category.toLowerCase()]);
      convertedProducts.push(this.productMatrix['department'][convProduct.Department.toLowerCase()]);
    });
    return (convertedOccupation.concat(convertedInterests).concat(convertedProducts));
  }

  recommend(userID) {
    return new Promise((resolve, reject) => {
      Profile.findById(userID)
        .populate('purchases')
        .exec()
        .then(foundProfile => {
          if (!foundProfile) {
            console.log('Could not find this user...');
            return reject()
          }
          // convert categorical data to numerical for modeling purposes
          const convertedUserMatrix = this._convertToNumericalMatrix(foundProfile);

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
        });
    })
      .catch(err => reject(err));
  }
}

module.exports = new MachineLearner();