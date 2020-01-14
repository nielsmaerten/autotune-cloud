const functions = require("firebase-functions");

let scheduleJobs = functions.pubsub.schedule("every 15 minutes").onRun(require("./jobs/scheduler"));
let onJobScheduled = functions
  .runWith({ timeoutSeconds: 540 })
  .firestore.document("jobs/{jobId}")
  .onCreate(require("./jobs/on-job-scheduled"));

require("firebase-admin").initializeApp();
module.exports = {
  scheduleJobs,
  onJobScheduled
};
