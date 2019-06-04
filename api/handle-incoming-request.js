const uuid = require("./uuid"),
  fs = require("fs"),
  getAutotunePrefs = require("./get-autotune-prefs"),
  spawn = require("child_process").spawn,
  nsProfileConvert = require("nightscout-profile-convert");

module.exports = async (req, res) => {
  // Create a working directory for this request
  const requestId = uuid();
  const workingDirectory = `/openaps/${requestId}`;
  const settingsDirectory = `${workingDirectory}/settings`;
  fs.mkdirSync(settingsDirectory, { recursive: true });
  console.log("Initializing working directory: ", workingDirectory);

  const profilePath = `${settingsDirectory}/profile.json`;
  const profileName = req.query.profileName || "autotune";
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
        nsHost: req.query.nsHost,
        min5mCarbimpact: req.query.min5mCarbimpact,
        profileName: profileName,
        usingDefaultProfile: req.query.profileName === undefined
      }
    });
    return;
  }

  // Copy profile.json -> pumpprofile.json and autotune.json
  fs.copyFileSync(profilePath, `${settingsDirectory}/pumpprofile.json`);
  fs.copyFileSync(profilePath, `${settingsDirectory}/autotune.json`);

  // Set timezone from profile
  const timezone = require(profilePath).timezone;
  const zoneinfo = "/usr/share/zoneinfo/" + timezone;
  if (!timezone || !fs.existsSync(zoneinfo)) {
    res.status(400).send("Profile must have a valid 'timezone' key.");
    return;
  }
  fs.copyFileSync(zoneinfo, "/etc/localtime");
  console.log("Timezone set to: ", timezone);

  // Invoke autotune
  try {
    // Set autotune parameters
    const autotunePrefs = getAutotunePrefs(req.query);
    autotunePrefs.push(`--dir=${workingDirectory}`);
    console.log("Setting parameters to: ", autotunePrefs);

    await new Promise(resolve => {
      // Start the process
      const child = spawn("oref0-autotune", autotunePrefs);

      child.on("error", error => {
        console.error(error);
        res.status(500).send(error.toString());
      });
      // child.stdout.on("data", _ => console.log(_.toString()));
      child.stderr.on("data", _ => console.warn(_.toString()));
      child.on("close", code => {
        // After exiting, inspect exit code
        if (code === 0) {
          // All good? Send the recommendations in the response
          const outFile = `${workingDirectory}/autotune/autotune_recommendations.log`;
          res.sendFile(outFile);
          console.log("All good. Request completed.");
        } else {
          // :(
          res.status(500).send("Something crashed, sorry :(");
          console.error("Failed running autotune.");
        }
        resolve();
      });
    });
  } catch (error) {
    // User set some bad parameters
    res.status(400).send(error);
  }
};
