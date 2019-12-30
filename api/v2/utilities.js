const merge = require("lodash.merge");
const constants = require("./constants");
const axios = require("axios").default;

/**
 * Merges the default settings with the ones
 * provided in the request and returns the result
 * @param {Express.Request} request
 */
function getSettings(request) {
  let settings = Object.assign({}, constants.defaultSettings);
  if (!request.query.nsSecret || !request.query.nsSite) {
    throw new Error("nsSite and nsSecret are required parameters");
  }
  return merge(settings, request.query);
}

/**
 * Checks if a rig is online by checking the NS site.
 * If the latest reading is less than n minutes old,
 * the rig is considered online.
 */
async function isRigOnline(settings, minimumOnline) {
  let res = await axios.get(`${settings.nsSite}/api/v1/entries/current.json`);

  let lastEntry = res.data[0];
  let lastEntryDate = new Date(lastEntry.dateString || lastEntry.date);
  let now = new Date();
  let cutoff = 1000 * 60 * minimumOnline; // minutes to milliseconds

  let lastEntryPostCutoff = (now.getTime() - cutoff < lastEntryDate.getTime());
  return lastEntryPostCutoff;
}

module.exports = {
  getSettings,
  isRigOnline
};
