const tf = require('@tensorflow/tfjs-node');
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
    this.convertedSize = 0;
    this._dummyEncode(occupations, this.occupationMatrix);
    this._dummyEncode(interests, this.interestMatrix);
    this._labelEncode(products, this.productMatrix);

    this.printConversionMatrix = this.printConversionMatrix.bind(this);
    this._convertToNumericalMatrix = this._convertToNumericalMatrix.bind(this);
    this._resizeVectors = this._resizeVectors.bind(this);
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
   * @param baseProfile tf.tensor of a user + product data
   * @param comparisonProfile tf.tensor of another user + product data
   * @returns {number} -1 <= number <= 1 (cosine of the vectors)
   */
  _calcSimilarity(baseProfile, comparisonProfile) {
    const base = tf.tensor(baseProfile);
    const comparison = tf.tensor(comparisonProfile);
    return (base.dot(comparison).arraySync())
      / (Math.sqrt(base.square().sum().arraySync()) * Math.sqrt(comparison.square().sum().arraySync()));
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
      let bigReturnObject = {};
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
          this.convertedSize = convertedUserMatrix.length;

          // find every other user
          Profile.find({ _id: { $ne: userID } })
            .populate('purchases')
            .exec()
            .then(allProfiles => {
              if (!allProfiles) {
                return reject('There are no profiles in the database to recommend from');
              }
              let convertedProfileMatrices = [];
              let unorderedSimilarityMatrix = {};
              let orderedSimilarityMatrix = {};
              let mostSimilarUsers = [];
              let similaritySum = 0;
              for (let prof = 0; prof < allProfiles.length; prof++) {
                // convert each user's categorical profile to categorical data
                convertedProfileMatrices.push(this._convertToNumericalMatrix(allProfiles[prof]));
                this._resizeVectors(convertedUserMatrix, convertedProfileMatrices[prof]);
                const similarity = this._calcSimilarity(convertedUserMatrix, convertedProfileMatrices[prof]);
                unorderedSimilarityMatrix[similarity] = prof; // creates an object where the keys are the similarities and the values are the profile from which it came
              }
              // sort the resulting
              Object.keys(unorderedSimilarityMatrix).sort((a, b) => b - a).forEach(sim => {
                orderedSimilarityMatrix[sim] = unorderedSimilarityMatrix[sim];
              });

              // preparing the return information
              bigReturnObject.orderedSimilarities = orderedSimilarityMatrix;
              bigReturnObject.similaritySum = similaritySum;

              console.log(JSON.stringify(orderedSimilarityMatrix, null, ' '));
              // Pick the top 10 similar profiles:
              const orderedKeys = Object.keys(orderedSimilarityMatrix);
              for (let key = 0; key < 10; key++) {
                const keyWeWant = orderedKeys[key];
                const profileWeWant = orderedSimilarityMatrix[keyWeWant]; // grabs the profile of the user from the first 10 highest similarities
                mostSimilarUsers.push(allProfiles[profileWeWant]);
                // calculate the similarity sum of the top 10 users
                similaritySum += Number(keyWeWant);
              }

              bigReturnObject.mostSimilarUsers = mostSimilarUsers;

              // now we need to calculate a weight of 1 * similarity if comparison user purchased a product
              // for every product in the db that is not one the current user has purchased:
              const productsAlreadyPurchased = [];
              foundProfile.purchases.forEach(product => productsAlreadyPurchased.push(product._id));

              let unorderedRecommendedProducts = {};
              let orderedRecommendedProducts = {};
              let mostSimilarProducts = [];
              let sumProductSimilarity = 0;
              for (let prof = 0; prof < mostSimilarUsers.length; prof++) {
                let currUserPurchases = [];
                const simUser =  mostSimilarUsers[prof];
                simUser.purchases.forEach(product => {
                  currUserPurchases.push(product._id);
                });
                Product.find({ $and: [ { _id: { $nin: [...productsAlreadyPurchased] } }, { _id: { $in: [...currUserPurchases] } } ] })
                  .exec()
                  .then(foundProducts => {
                    if (!foundProducts) {
                      return console.log('Compared user did not have any additional products than the base');
                    }
                    foundProducts.forEach(p => {
                      const productSim = Number(orderedKeys[prof]) / similaritySum;
                      unorderedRecommendedProducts[productSim] = p;
                    });
                  })
                  .catch(err => console.log(`Error finding products between already purchased and current user purchases: ${err}`));
              }
              Object.keys(unorderedRecommendedProducts).sort((a, b) => b - a).forEach(prediction => {
                orderedRecommendedProducts[prediction] = unorderedRecommendedProducts[prediction];
              });

              bigReturnObject.orderedRecommendations = orderedRecommendedProducts;

              const orderedKeysRecommendations = Object.keys(orderedRecommendedProducts);
              for (let key = 0; key < 5; key++) {
                const keyWeWant = orderedKeysRecommendations[key];
                const productWeWant = orderedRecommendedProducts[keyWeWant];
              }
            })
            .catch(err => console.log(`Mongo experienced an error retrieving all profiles for recommendations. Error: ${err}`))
        })
        .catch(err => reject(err));
    });
  }

  _resizeVectors(baseUser, comparisonUser) {
    const currBaseUserSize = baseUser.length;
    const comparisonLength = comparisonUser.length;

    // Case 1: Comparison user has more purchases than the base when base is original size
    if (comparisonLength > currBaseUserSize) {
      for (let diff = comparisonLength - currBaseUserSize; diff > 0; diff--) {
        baseUser.push(0);
      }
    }
    // Case 2: base has more purchases than the comparison when base is original length (no previous shifting)
    else if (currBaseUserSize > comparisonLength && currBaseUserSize === this.convertedSize) {
      // if base has not changed sizes and is larger, then the comparison must change
      for (let diff = currBaseUserSize - comparisonLength; diff > 0; diff--) {
        comparisonUser.push(0);
      }
    }
    // Case 3: base has more purchases than the comparison but the base has been previously extended (no meaningful data)
    else if (currBaseUserSize > comparisonLength && currBaseUserSize !== this.convertedSize) {
      // Inner case 1: Base and Comparison are truly the same size
      if (this.convertedSize === comparisonLength) {
        for (let diff = currBaseUserSize - comparisonLength; diff > 0; diff--) {
          comparisonUser.pop();
        }
      }
      // Inner case 2: Base is truly larger than the comparison
      else  if(this.convertedSize > comparisonLength) {
        // bring base back to original size
        for (let diff = currBaseUserSize - this.convertedSize; diff > 0; diff--) {
          baseUser.pop()
        }
        // bring the comparison up to the base size
        for (let diff = this.convertedSize - comparisonLength; diff > 0; diff --) {
          comparisonUser.push(0);
        }
      }
      // Inner case 3: Base is truly smaller than the comparison
      else {
        // bring the base user down to the comparison
        for (let diff = currBaseUserSize - comparisonLength; diff > 0; diff--) {
          baseUser.pop();
        }
      }
    }
  }
}

module.exports = new MachineLearner();