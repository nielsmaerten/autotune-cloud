import axios from "axios";
import { config } from "firebase-functions";

/**
 * - Called when a job is created for a user
 * @param {import("firebase-functions/lib/providers/firestore").DocumentSnapshot} change 
 * @param {import("firebase-functions").EventContext} context 
 */
function onJobScheduled(change, context) {
    let autotuneUrl = config().settings.autotune_url;
    let user = change.data();

    // Configure parameters for Autotune run
    let autotuneParams = {
        nsSite: user.nsSite,
        nsSecret: user.nsSecret,
        min5mCarbImpact: user.min5mCarbImpact,
        "profileNames[backup]": user.profileNames.backup,
        "profileNames[autotune]": user.profileNames.autotune
    }
    if (user.categorizeUamAsBasal) autotuneParams.categorizeUamAsBasal = true;

    // Start Autotune by calling docker container
    let response = await axios.get(autotuneUrl, {
        data: autotuneParams
    })

    // Throw error if response was not OK
    if (response.status !== 200) {
        throw new Error(`
            Error running Autotune for user: 
            ================================
            ${user}

            Error details: 
            ==============
            ${response.data}
        `)
    }
}
export default onJobScheduled;