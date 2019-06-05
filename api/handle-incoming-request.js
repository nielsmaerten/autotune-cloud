const uuid = require("./uuid"),
  fs = require("fs"),
  getAutotunePrefs = require("./get-autotune-prefs"),
  spawn = require("child_process").spawn,
  nsProfileConvert = require("nightscout-profile-convert"),
  timezones = require("tz-ids");

module.exports = async (req, res) => {
  // Create a working directory for this request
  const requestId = uuid();
  const workingDirectory = `/openaps/${requestId}`;
  const settingsDirectory = `${workingDirectory}/settings`;
  fs.mkdirSync(settingsDirectory, { recursive: true });
  console.log("Initializing working directory: ", workingDirectory);

  const profilePath = `${settingsDirectory}/profile.json`;
  const profileName = req.query.profileName;
  try {
    // Fetch profile from Nightscout
    let nsProfile = await nsProfileConvert.fetchProfile(
      req.query.nsHost,
      profileName
    );

    // Convert profile to oref0-autotune format
    let profile = nsProfileConvert.convertProfile(
      nsProfile,
      req.query.min5mCarbimpact
    );

    // Save the profile to the working directory
    fs.writeFileSync(profilePath, JSON.stringify(profile));
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error: {
        msg: "Failed to load profile from Nightscout",
        details: error
      },
      parameters: {
        nsHost: req.query.nsHost || "REQUIRED",
        min5mCarbimpact: req.query.min5mCarbimpact || "REQUIRED",
        profileName: profileName || "Not specified",
        usingDefaultProfile: req.query.profileName === undefined
      }
    });
    return;
  }

  // Copy profile.json -> pumpprofile.json and autotune.json
  fs.copyFileSync(profilePath, `${settingsDirectory}/pumpprofile.json`);
  fs.copyFileSync(profilePath, `${settingsDirectory}/autotune.json`);

  // Get timezone from query with fallback to Nightscout Profile
  const timezone = req.query.timezone || require(profilePath).timezone;
  if (!timezone || !timezones.includes(timezone)) {
    res
      .status(400)
      .send(
        `No valid timezone found. Provide a timezone in the querystring, or the Nightscout profile.`
      );
    return;
  }

  // Set autotune parameters
  const autotunePrefs = getAutotunePrefs(req.query);
  autotunePrefs.push(`--dir=${workingDirectory}`);

  // Invoke autotune
  await new Promise((resolve, reject) => {
    // Start the process
    console.log("Setting timezone to:", timezone);
    console.log("Starting: ", "oref0-autotune", autotunePrefs.join(" "));
    const child = spawn("oref0-autotune", autotunePrefs, {
      env: {
        TZ: timezone
      },
      detached: true
    });

    // Confirm process is responding
    let gotOutput = false;
    let gotErrors = false;
    const processResp = (data, dataType) => {
      if (dataType === "out") {
        gotOutput = true;
        console.log("Autotune is running...");
      } else if (dataType === "err") {
        gotErrors = true;
        console.warn("Autotune has encountered an error:", data.toString());
      }
    };
    child.stdout.on("data", data => !gotOutput && processResp(data, "out"));
    child.stderr.on("data", data => !gotErrors && processResp(data, "err"));

    // Handle process exits
    child.on("error", reject);
    child.on("close", code => {
      // Inspect exit code
      if (code === 0) {
        // Success
        const recommends = `${workingDirectory}/autotune/autotune_recommendations.log`;
        resolve(recommends);
      } else {
        // Failure
        reject("Autotune failed with exit code: " + code);
      }
    });
  })

    // After successful completion, send the recommendations back
    .then(recommends => {
      console.log("Completed successfully. Sending recommendations...");
      res.sendFile(recommends);
    })

    // In case of failure, report exit code
    .catch(error => {
      console.error(error.toString());
      res.status(500).send(error.toString());
    });
};
