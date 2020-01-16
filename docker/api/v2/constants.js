module.exports = {
  defaultSettings: {
    // Defaults
    writeRecommendations: false,
    profileNames: {
      backup: "Backup Profile",
      autotune: "Autotune"
    },
    min5mCarbImpact: 8,
    categorizeUamAsBasal: false,
    maxDecimals: 2,
    startDaysAgo: 1,

    // User-provided parameters
    nsSite: undefined,
    nsApiSecret: undefined,
    customTimeout: undefined
  }
};
