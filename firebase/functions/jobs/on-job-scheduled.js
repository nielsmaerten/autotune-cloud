const axios = require("axios").default;
const config = require("firebase-functions").config;
const firestore = require("firebase-admin").firestore;

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
        writeRecommendations: true,
        maxDecimals: user.maxDecimals
    }
    if (user.categorizeUamAsBasal) autotuneParams.categorizeUamAsBasal = true;

    // Start Autotune by calling docker container
    let autotuneUrl = config().settings.autotune_url;
    let error;
    console.log("Running Autotune for", context.params.jobId, "with these parameters:", autotuneParams);

    // Send HTTP request with user parameters
    await axios.get(autotuneUrl, {
        params: autotuneParams
    }).catch(e => { error = e })


    // Clean up the job document
    await firestore().doc(`jobs/${context.params.jobId}`).delete();

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
    `)
    }


}
module.exports = onJobScheduled;