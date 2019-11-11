const occupations = require('./rawData/occupations');
const interests = require('./rawData/interests');

let occupationMatrix = {};
let interestMatrix = {};

convertOccupations = () => {
  for (let occ = 0; occ < occupations.length; occ++) {
    const stringOcc = occupations[occ];
    occupationMatrix[stringOcc] = [];

    for (let i = 0; i < occupations.length; i++) {
      if (i === occ) {
        occupationMatrix[stringOcc][i] = 1;
      }
      else {
        occupationMatrix[stringOcc][i] = 0;
      }
    }
  }
  return occupationMatrix;
};

convertInterests = () => {

};

module.exports = {
  occupationMatrix: convertOccupations(),
  interestMatrix: convertInterests()
};