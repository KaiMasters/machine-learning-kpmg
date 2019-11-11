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
    this.convertedSize = 0;
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
          this.convertedSize = convertedUserMatrix.length;

          Profile.find({})
            .exec()
            .then(allProfiles => {
              if (!allProfiles) {
                return reject('There are no profiles in the database to recommend from');
              }
              let convertedProfileMatrices = [];
              let similarityMatrix = [];
              for (let prof = 0; prof < allProfiles.length; prof++) {
                // convert each user's categorical profile to categorical data
                convertedProfileMatrices.push(this._convertToNumericalMatrix(allProfiles[prof]));
                this._resizeVectors(convertedUserMatrix, convertedProfileMatrices[prof]);
                similarityMatrix.push(this._calcSimilarity(convertedUserMatrix, convertedProfileMatrices[prof]));
              }

              allProfiles.forEach(profile => {
                convertedProfileMatrices.push(this._convertToNumericalMatrix(profile));
                similarityMatrix.push(this._calcSimilarity(convertedUserMatrix, ))
              });
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