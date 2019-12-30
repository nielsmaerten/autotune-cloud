const childProcess = require("child_process");
const fs = require("fs");

module.exports = async (settings, workingDir) => {
  // Start process externally
  let child = spawnAutotune(settings, workingDir);

  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", exitCode => {
      if (exitCode === 0) {
        fs.copyFileSync(
          // This overwrites /settings/profile.json
          `${workingDir}/autotune/profile.json`,
          `${workingDir}/settings/profile.json`
        );
        let recommendations = fs.readFileSync(
          `${workingDir}/autotune/autotune_recommendations.log`
        );
        resolve(recommendations);
      } else reject("Autotune failed with exit code: " + exitCode);
    });
  });
};

function spawnAutotune(settings, workingDir) {
  let parameters = [
    "-d=" + workingDir,
    "-n=" + settings.nsSite,
    "--categorize-uam-as-basal=" + settings.categorizeUamAsBasal
  ];
  console.log("oref0-autotune", parameters.join(" "));
  return childProcess.spawn("oref0-autotune", parameters, {
    env: {
      TZ: settings.timezone
    },
    detached: true
  });
}
