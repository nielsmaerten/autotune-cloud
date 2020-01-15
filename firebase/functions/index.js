const functions = require("firebase-functions");

let scheduleJobs = functions.pubsub.schedule("0,15,30,45 * * * *").onRun(require("./jobs/scheduler"));
let onJobScheduled = functions
  .runWith({ timeoutSeconds: 540 })
  .firestore.document("jobs/{jobId}")
  .onCreate(require("./jobs/on-job-scheduled"));

require("firebase-admin").initializeApp();
module.exports = {
  scheduleJobs,
  onJobScheduled
};
