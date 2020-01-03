const axios = require("axios").default;
const sha1 = require("../utilities").sha1;

async function switchProfile(settings) {
  console.log("Switching profile...");

  let switchEvent = {
    enteredBy: "Autotune Cloud",
    eventType: "Profile Switch",
    duration: 0,
    profile: settings.profileNames.autotune,
    reason: "Applying Autotuned profile",
    notes: "Applying Autotuned profile"
  };

  await axios.post(`${settings.nsSite}/api/v1/treatments.json`, switchEvent, {
    headers: {
      "api-secret": sha1(settings.nsSecret)
    }
  });
}

module.exports = switchProfile;
