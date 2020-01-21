// @ts-check
const firestore = require("firebase-admin").firestore;

/**
 * - Runs periodically
 * - Finds and deletes jobs older than 2 hours
 */
async function purge() {
  // Get a timestamp of 2 hours ago
  let now = new Date().getTime();
  let _2hoursAgo = new Date(now - 2 * 60 * 60 * 1000);

  // Find jobs started before that timestamp
  let query = firestore()
    .collection("jobs")
    .where("jobStarted", "<=", _2hoursAgo);
  let result = await query.get();

  // Extract references of the jobs
  let jobsToPurge = result.docs.map(doc => doc.ref);

  // Create new batch, set counter to 0
  let batch = firestore().batch();
  let batchCount = 0;

  // Iterate over jobs, adding delete commands to the batch
  while (jobsToPurge.length > 0) {
    batch.delete(jobsToPurge.pop());
    batchCount++;
    if (batchCount === 500 || jobsToPurge.length === 0) {
      await batch.commit();
      batch = firestore().batch();
    }
  }
}
module.exports = purge;
