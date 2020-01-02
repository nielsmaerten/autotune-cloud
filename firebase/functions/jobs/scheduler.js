import { firestore } from "firebase-admin";

/**
 * - Runs periodically
 * - Finds users that should have Autotune run
 * - Schedules a job for each user to run Autotune
 * @param {import("firebase-functions").EventContext} context 
 */
function scheduler(context) {
    // If the nextRun is scheduled within 10 minutes from now
    // it gets run as part of this batch
    let now = new Date().getTime();
    let _10minutesFromNow = new Date(now + (10 * 60 * 1000));

    // Get all users we should schedule a job for
    let query = firestore().collection("users")
        .where("enabled", "==", true)
        .where("nextRun", "<=", _10minutesFromNow);
    let users = await query.get();

    // Schedule a job for each user
    let batch = firestore().batch(), batchCount = 0;
    for (let i = 0; i < users.docs.length; i++) {
        // Get user data
        const user = users.docs[i];
        const userData = user.data();

        // Create a 'job' document to trigger Autotune
        batch.set(`jobs/${user.id}`, userData);

        // Schedule the next run in 24 hours
        userData.nextRun = new Date(now + (24 * 60 * 60 * 1000));
        batch.update(`user/${user.id}`, userData);

        // Commit the batch if this is the last user,
        // or if the batch contains 500 items
        batchCount += 2;
        if (batchCount >= 500 || i == user.docs.length - 1) {
            await batch.commit();
            batchCount = 0;
            batch = firestore().batch();
        }
    }

}
module.exports = scheduler;