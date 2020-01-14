const childProcess = require("child_process");
const fs = require("fs");
const glob = require("glob");

module.exports = async (settings, workingDir) => {
  // Start process externally
  let child = spawnAutotune(settings, workingDir);

  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", async exitCode => {
      if (exitCode === 0) {
        fs.copyFileSync(
          // This overwrites /settings/profile.json
          `${workingDir}/autotune/profile.json`,
          `${workingDir}/settings/profile.json`
        );
        let recommendations = await readLogFile(workingDir);
        resolve(recommendations);
      } else reject("Autotune failed with exit code: " + exitCode);
    });
  });
};

function readLogFile(workingDir) {
  return new Promise((resolve, reject) => {
    glob(`${workingDir}/autotune/autotune.*.log`, (err, files) => {
      if (err) reject(err);
      let fileContents = fs.readFileSync(files[0]);
      resolve(fileContents);
    });
  });
}

function spawnAutotune(settings, workingDir) {
  let parameters = [
    "-d=" + workingDir,
    "-n=" + settings.nsSite,
    "--categorize-uam-as-basal=" + settings.categorizeUamAsBasal,
    "--start-days-ago" + settings.startDaysAgo
  ];
  console.log("oref0-autotune", parameters.join(" "));
  return childProcess.spawn("oref0-autotune", parameters, {
    env: {
      TZ: settings.timezone
    },
    detached: true
  });
}
