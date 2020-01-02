const fs = require("fs");

module.exports = (settings, workingDir) => {
  // Load profile from disk
  let profilePath = `${workingDir}/settings/profile.json`;
  let profile = JSON.parse(fs.readFileSync(profilePath));

  // Round basal rates to max number of decimals
  for (let i = 0; i < profile.basalprofile.length; i++) {
    const block = profile.basalprofile[i];
    let r = Math.pow(10, settings.maxDecimals);
    block.rate = Math.round(block.rate * r) / r;
  }

  return profile;
};
