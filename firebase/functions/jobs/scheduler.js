const firestore = require("firebase-admin").firestore;

/**
 * - Runs periodically
 * - Finds users that should have Autotune run
 * - Schedules a job for each user to run Autotune
 * @param {import("firebase-functions").EventContext} context
 */
async function scheduler(context) {
  // If the nextRun is scheduled within 10 minutes from now
  // it gets run as part of this batch
  let now = new Date().getTime();
  let _10minutesFromNow = new Date(now + 10 * 60 * 1000);

  // Get all users we should schedule a job for
  let query = firestore()
    .collection("users")
    .where("enabled", "==", true)
    .where("nextRun", "<=", _10minutesFromNow);
  let users = await query.get();
  if (users.size > 0) console.log("Scheduling autotune for", users.size, "user(s)...");

  // Schedule a job for each user
  let batch = firestore().batch(),
    batchCount = 0;
  for (let i = 0; i < users.docs.length; i++) {
    // Get user data
    const user = users.docs[i];
    const userData = user.data();
    userData.jobStarted = new Date();

    // Create a 'job' document to trigger Autotune
    batch.set(firestore().doc(`jobs/${user.id}`), userData);

    // Schedule the next run
    let msFromNow = userData.runInterval * 86400000; // runInterval * 1 day
    userData.nextRun = new Date(userData.nextRun.toMillis() + msFromNow);
    batch.update(firestore().doc(`users/${user.id}`), userData);

    // Commit the batch if this is the last user,
    // or if the batch contains 500 items
    batchCount += 2;
    if (batchCount >= 500 || i == users.docs.length - 1) {
      await batch.commit();
      batchCount = 0;
      batch = firestore().batch();
    }

    console.log("Job scheduled for user", user.id, "Next run will be on", userData.nextRun);
  }
}
module.exports = scheduler;
