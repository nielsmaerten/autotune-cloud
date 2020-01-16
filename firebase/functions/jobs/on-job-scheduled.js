// @ts-check
const axios = require("axios").default;
const config = require("firebase-functions").config;
const firestore = require("firebase-admin").firestore;
const constants = require("../constants");

/**
 * - Called when a job is created for a user
 * @param {import("firebase-functions/lib/providers/firestore").DocumentSnapshot} change
 * @param {import("firebase-functions").EventContext} context
 */
async function onJobScheduled(change, context) {
  let user = change.data();

  // Configure parameters for Autotune run
  let autotuneParams = {
    nsSite: user.nsSite,
    nsSecret: user.nsSecret,
    min5mCarbImpact: user.min5mCarbImpact,
    "profileNames[backup]": user.profileNames.backup,
    "profileNames[autotune]": user.profileNames.autotune,
    maxDecimals: user.maxDecimals,
    startDaysAgo: user.runInterval,
    customTimeout: constants.maxJobRuntimeSeconds - 5
  };

  // The following parameters should be omitted to be falsy, so only add them if truthy
  if (user.categorizeUamAsBasal) autotuneParams.categorizeUamAsBasal = true;
  if (!user.dryRun) autotuneParams.writeRecommendations = true;

  // Start Autotune by calling docker container
  let autotuneUrl = config().settings.autotune_url;
  let error;
  let msg = `Running Autotune for ${context.params.jobId} with these params: ${JSON.stringify(
    autotuneParams
  )}`;
  console.log(msg);

  // Send HTTP request with user parameters
  let response = await axios
    .get(autotuneUrl, {
      params: autotuneParams
    })
    .catch(e => {
      error = e;
      return e.response;
    });

  // Send log by email if user has an email address defined
  let format = { weekday: "long", month: "long", day: "numeric" };
  let today = new Date();
  await firestore()
    .collection("mail")
    .add({
      from: "Autotune Cloud<autotune@diabase.app>",
      toUids: [context.params.jobId],
      template: {
        name: "autotune-results",
        data: {
          output: response.data,
          date: today.toLocaleDateString("en", format),
          nightscoutUpdated: !user.dryRun,
          name: user.name
        }
      }
    });

  // Clean up the job document
  await firestore()
    .doc(`jobs/${context.params.jobId}`)
    .delete();

  // Throw if result was not OK
  if (error) {
    throw new Error(`
        Error running Autotune for user: 
        ================================
        ${context.params.jobId}
        ${JSON.stringify(user)}

        Error details: 
        ==============
        ${error}
    `);
  }
}
module.exports = onJobScheduled;
