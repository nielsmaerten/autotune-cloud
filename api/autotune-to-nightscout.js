// @ts-check

module.exports = (nsProfile, atProfile) => {
  let newProfile = Object.assign({}, nsProfile);
  newProfile.basal = [];
  newProfile.sens = [];
  newProfile.carbratio = [];

  // BASAL PROFILE
  atProfile.basalprofile.forEach(t => {
    newProfile.basal.push({
      time: t.start.substr(0, 5),
      value: Math.round(t.rate * 100) / 100, // round to 2 decimals
      timeAsSeconds: t.minutes * 60
    });
  });

  // INSULIN SENSITIVITY FACTOR
  atProfile.isfProfile.sensitivities.forEach(t => {
    newProfile.sens.push({
      time: t.start.substr(0, 5),
      value: t.sensitivity,
      timeAsSeconds: t.offset * 60
    });
  });

  // CARB RATIO
  newProfile.carbratio.push({
    time: "00:00",
    value: atProfile.carb_ratio,
    timeAsSeconds: 0
  });

  return newProfile;
};
