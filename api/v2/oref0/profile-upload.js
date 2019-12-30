const roundProfileBlocks = require("./round-profile-blocks");
const axios = require("axios").default;

module.exports = async (settings, workingDir) => {
  // 1. Round profile blocks
  //    This is required because not all pumps support basal rates with 3 decimals
  let tunedProfile = roundProfileBlocks(settings, workingDir);

  // 2. Get the existing profile from Nightscout
  let payload = await fetchProfiles(settings);
  let allProfiles = payload.store;
  let nsProfile = allProfiles[settings.profileNames.autotune];

  // 3. Check if the profile works with autotune
  validateNsProfile(nsProfile);

  // 4. Modify the Nightscout Profile to match the tuned profile
  updateProfile(nsProfile, tunedProfile);

  // 5. Overwrite the NS payload with the updated profile, and upload the result
  allProfiles[settings.profileNames.autotune] = nsProfile;
  payload.store = allProfiles;
  await uploadProfiles(payload, settings);
};

/*************************
 *   HELPER FUNCTIONS    *
 *************************/

function sha1(input) {
  return require("crypto")
    .createHash("sha1")
    .update(input)
    .digest("hex");
}

async function uploadProfiles(profiles, settings) {
  let url = `${settings.nsSite}/api/v1/profile`;
  await axios
    .put(url, profiles, {
      headers: {
        "api-secret": sha1(settings.nsSecret)
      }
    })
    .catch(e => {
      console.error(e);
      throw e;
    });
}

async function fetchProfiles(settings) {
  let url = `${settings.nsSite}/api/v1/profile`;
  let response = await axios.get(url, {
    headers: {
      "api-secret": sha1(settings.nsSecret)
    }
  });
  return response.data[0];
}

function updateProfile(nsProfile, tunedProfile) {
  // BASALS
  for (let i = 0; i < tunedProfile.basalprofile.length; i++) {
    const tunedBlock = tunedProfile.basalprofile[i];
    nsProfile.basal[i].value = tunedBlock.rate;
  }

  // CARB RATIO
  nsProfile.carbratio[0].value = tunedProfile.carb_ratio;

  // ISF
  nsProfile.sens[0].value = tunedProfile.sens;
}

function validateNsProfile(nsProfile) {
  let valid =
    nsProfile.basal.length === 24 &&
    nsProfile.carbratio.length === 1 &&
    nsProfile.sens.length === 1;
  if (!valid)
    throw new Error(`
            For autotune to work, both your Nightscout Profiles must have:
            - exactly 24 basal slots (1 per hour)
            - exactly 1 carb ratio (entire day)
            - exactly 1 insulin sensivity factor (entire day)
        `);
}
