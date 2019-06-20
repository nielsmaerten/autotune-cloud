// @ts-check
const uuid = require("./uuid"),
  fs = require("fs"),
  getAutotunePrefs = require("./get-autotune-prefs"),
  spawn = require("child_process").spawn,
  nsProfileConvert = require("nightscout-profile-convert"),
  fetch = require("node-fetch").default,
  param = require("jquery-param"),
  autosyncProfileName = "Autotune Sync",
  // @ts-ignore
  timezones = require("tz-ids");

module.exports = async (req, res) => {
  // Check if profile needs to be auto-updated
  let updateNsProfile = req.query.updateNsProfile && (req.query.updateNsProfile.toLowerCase() === "true")
  if (updateNsProfile) {
    if (req.query.profileName !== autosyncProfileName) {
      res.status(400).send(`
      If you want to auto-update your profile, the profileName needs to be: "${autosyncProfileName}".
      Don't already have a profile with this name in Nightscout?
      Then duplicate your existing profile and rename it to "${autosyncProfileName}".

      This is to make sure there's always a backup of your original profile that Autotune won't change.
        `);
      return;
    }
  }

  // Create a working directory for this request
  const requestId = uuid();
  const workingDirectory = `/openaps/${requestId}`;
  const settingsDirectory = `${workingDirectory}/settings`;
  fs.mkdirSync(settingsDirectory, { recursive: true });
  console.log("Initializing working directory: ", workingDirectory);

  const profilePath = `${settingsDirectory}/profile.json`;
  const profileName = req.query.profileName;
  let nightscoutProfiles;
  let selectedProfile;
  try {
    // Fetch all profiles from Nightscout
    nightscoutProfiles = await nsProfileConvert.fetchProfile(
      req.query.nsHost,
      null,
      true
    );
    nightscoutProfiles = nightscoutProfiles[0];

    // Use the profile from the query, or fall back to the default profile
    selectedProfile =
      nightscoutProfiles.store[
      profileName || nightscoutProfiles.defaultProfile
      ];
    if (!selectedProfile)
      throw new Error("No profile found with name: " + profileName);

    // Convert profile to oref0-autotune format
    let autotuneProfile = nsProfileConvert.convertProfile(
      selectedProfile,
      req.query.min5mCarbimpact
    );

    // Save the profile to the working directory
    fs.writeFileSync(profilePath, JSON.stringify(autotuneProfile));
  } catch (e) {
    console.error(e);
    res.status(500).send({
      error: {
        msg: "Failed to load profile from Nightscout",
        details: ""+e
      },
      parameters: {
        nsHost: req.query.nsHost || "REQUIRED",
        min5mCarbimpact: req.query.min5mCarbimpact || "REQUIRED",
        profileName: profileName || "Not specified, using default",
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
        resolve();
      } else {
        // Failure
        reject("Autotune failed with exit code: " + code);
      }
    });
  })

    // Upload profile back to Nightscout
    .then(async () => {
      // Bail if user didn't ask to upload profile
      if (!updateNsProfile) return;

      console.log("Uploading profile to Nightscout...");
      await uploadProfileToNightscout(
        req.query.nsHost,
        req.query.nsSecretHash,
        nightscoutProfiles,
        selectedProfile,
        workingDirectory
      );
    })
    .then(() => {
      // Complete request by sending recommendations back
      const recommendations = `${workingDirectory}/autotune/autotune_recommendations.log`;
      console.log("Completed successfully. Sending recommendations...");
      res.send(fs.readFileSync(recommendations).toString())
    })

    // In case of failure, report exit code
    .catch(error => {
      console.error(error.toString());
      res.status(500).send(error.toString());
    });
};

async function uploadProfileToNightscout(
  nsHost,
  nsSecretHash,
  originalProfiles,
  selectedProfile,
  workingDirectory
) {
  // Load the autotuned profile
  let autotunedProfile = JSON.parse(
    fs.readFileSync(`${workingDirectory}/autotune/profile.json`).toString()
  );

  // Convert back to nightscout format
  const autotuneToNightscout = require("./autotune-to-nightscout");
  let autotunedNightscoutProfile = autotuneToNightscout(
    selectedProfile,
    autotunedProfile
  );

  // Set the profile on the original Nightscout JSON
  originalProfiles.store[autosyncProfileName] = autotunedNightscoutProfile;

  // Upload to Nightscout
  let url = new URL("api/v1/profile", nsHost).href;
  console.log("Uploading to:", url);
  // @ts-ignore
  await fetch(url, {
    method: "put",
    body: param(originalProfiles),
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "api-secret": nsSecretHash
    }
  }).then(res => {
    if (res.status !== 200) {
      throw new Error(
        `Failed to sync profile to Nightscout: Error ${res.status} ${
        res.statusText
        }. ${
        res.status === 401
          ? "Did you set the nsSecretHash parameter correctly?"
          : ""
        }`
      );
    }
  });
}
