const fs = require("fs");
const path = require("path");
const v4uuid = require("uuid/v4");
const oref0 = require("./oref0");

module.exports = async (openApsFiles, settings) => {
  // Prepare a working directory: /openaps/[UUID]
  const workingDir = createWorkingDir();
  console.log("Created: ", workingDir);

  // Place the openAPS files in the working dir
  placeOpenApsFiles(workingDir, openApsFiles);
  console.log("Settings in place. Running Autotune...");

  // Pull timezone from the Nightscout profile
  settings.timezone = openApsFiles.autotune.timezone;

  // Run autotune
  let recommendations = await oref0.autotune(settings, workingDir).catch(e => error(e));
  console.log("Autotune finished.");

  // Upload profile
  if (settings.writeRecommendations !== false) {
    await oref0.upload(settings, workingDir).catch(e => error(e));
    console.log("Profile uploaded to Nightscout. Cleaning up...");
  }

  // Cleanup
  console.log("Cleaning up...");
  require("rimraf").sync(workingDir);

  return recommendations;
};

function error(e) {
  console.error(e);
  throw e;
}

function createWorkingDir() {
  let dir = "/openaps/" + v4uuid();
  fs.mkdirSync(dir);
  return dir;
}

/**
 * Writes pumpprofile.json and profile.json to disk
 * @param {string} dir
 * @param {object} openApsFiles
 */
function placeOpenApsFiles(dir, openApsFiles) {
  let settingsDir = path.join(dir, "settings");
  fs.mkdirSync(settingsDir);

  let paths = {
    pumpprofile: path.join(settingsDir, "pumpprofile.json"),
    profile: path.join(settingsDir, "profile.json")
  };

  fs.writeFileSync(paths.profile, JSON.stringify(openApsFiles.autotune));
  fs.writeFileSync(paths.pumpprofile, JSON.stringify(openApsFiles.backup));
}
