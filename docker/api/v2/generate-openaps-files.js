const profileConverter = require("nightscout-profile-convert");

module.exports = async settings => {
  // 1: Get all profiles from Nightscout
  let profiles;
  try {
    const response = await profileConverter.fetchProfile(settings.nsSite, null, true);
    profiles = response[0].store;
  } catch (error) {
    throw new Error(`
        Unable to fetch profiles from Nightscout.
        Please note that read-protected sites are not currently supported.
        `);
  }

  // 2: Verify both profiles are present
  if (!profiles[settings.profileNames.backup] || !profiles[settings.profileNames.autotune])
    throw new Error(`
        Your Nightscout site is required to have these 2 profiles:
        - "${settings.profileNames.autotune}" 
        - "${settings.profileNames.backup}"

        If you have an Autotune and Backup profile, but they have different names,
        set their names in the querystring using 
        profileNames[backup] and profileNames[autotune]
    `);

  // 3: Convert profiles to OpenAPS format
  try {
    const backupProfile = profileConverter.convertProfile(
      profiles[settings.profileNames.backup],
      settings.min5mCarbImpact
    );
    const autotuneProfile = profileConverter.convertProfile(
      profiles[settings.profileNames.autotune],
      settings.min5mCarbImpact
    );

    return {
      backup: backupProfile,
      autotune: autotuneProfile
    };
  } catch {
    let errorMsg = "Failed to convert Nightscout profiles to OpenAPS format. See logs for details.";
    console.error(JSON.stringify(settings));
    console.error(JSON.stringify(profiles));
    throw new Error(errorMsg);
  }
};
