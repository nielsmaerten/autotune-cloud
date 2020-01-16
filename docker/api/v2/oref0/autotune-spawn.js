// @ts-check
const childProcess = require("child_process");
const fs = require("fs");
const TIMEOUT = +process.env.TIMEOUT;

module.exports = async (settings, workingDir) => {
  // Start process externally
  let child = spawnAutotune(settings, workingDir);

  // Kill process a few seconds before timeout expires
  let processTimeout = getMaxRuntimeMs(settings);
  let timeoutHandle = setTimeout(() => {
    child.kill();
  }, processTimeout);

  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", async (exitCode, signal) => {
      clearTimeout(timeoutHandle);
      console.log("Autotune exited. Code:", exitCode, "Signal:", signal);
      if (signal !== null) {
        reject(`
          [TIMEOUT] Sorry! Autotune jobs are capped after ${TIMEOUT} seconds.
          This request took longer and was aborted. Try decreasing the number of days.

          Autotune logs:

          ${readLogFile(workingDir)}
        `);
      } else if (exitCode === 0) {
        fs.copyFileSync(
          // This overwrites /settings/profile.json
          `${workingDir}/autotune/profile.json`,
          `${workingDir}/settings/profile.json`
        );
        let recommendations = readLogFile(workingDir);
        resolve(recommendations);
      } else reject("Autotune failed with exit code: " + exitCode);
    });
  });
};

function readLogFile(workingDir) {
  let fileContents = fs.readFileSync(`${workingDir}/autotune-cloud.log`);
  return fileContents;
}

function spawnAutotune(settings, workingDir) {
  let parameters = [
    "-d=" + workingDir,
    "-n=" + settings.nsSite,
    "--categorize-uam-as-basal=" + settings.categorizeUamAsBasal,
    "--start-days-ago=" + settings.startDaysAgo
  ];
  let out = fs.openSync(`${workingDir}/autotune-cloud.log`, "a");
  let err = fs.openSync(`${workingDir}/autotune-cloud.log`, "a");
  console.log("oref0-autotune", parameters.join(" "));
  return childProcess.spawn("oref0-autotune", parameters, {
    env: {
      TZ: settings.timezone
    },
    detached: false,
    stdio: ["ignore", out, err]
  });
}

function getMaxRuntimeMs(settings) {
  let timeout;

  // Use custom timeout if provided, and
  // lower than system-assigned timeout
  if (settings.customTimeout && settings.customTimeout < TIMEOUT) {
    timeout = settings.customTimeout;
  } else {
    timeout = TIMEOUT;
  }

  // Kill the process a few seconds before timeout expires
  // That way we can still send back the HTTP response
  timeout -= 5;

  return timeout * 1000;
}
