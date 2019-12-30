const merge = require("lodash.merge");
const constants = require("./constants");

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
 * If the latest reading is less than 15 minutes old,
 * the rig is considered online.
 */
function isRigOnline(settings) {
  // TODO
  console.error("WARNING: Skipping isRigOnline check. TODO: Implement this.");
  return true;
}

module.exports = {
  getSettings,
  isRigOnline
};
