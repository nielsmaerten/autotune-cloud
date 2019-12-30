module.exports = {
  defaultSettings: {
    // Defaults
    dryRun: true,
    profileNames: {
      backup: "Backup Profile",
      autotune: "Autotune"
    },
    min5mCarbImpact: 8,
    categorizeUamAsBasal: false,
    maxDecimals: 2,

    // User-provided parameters
    nsSite: undefined,
    nsApiSecret: undefined
  }
};
