// @ts-check

const functions = require("firebase-functions");
const constants = require("./constants");

let scheduleJobs = functions.pubsub
  .schedule(constants.cronSchedule)
  .onRun(require("./jobs/scheduler"));
let onJobScheduled = functions
  .runWith({ timeoutSeconds: constants.maxJobRuntimeSeconds })
  .firestore.document("jobs/{jobId}")
  .onCreate(require("./jobs/on-job-scheduled"));

require("firebase-admin").initializeApp();
module.exports = {
  scheduleJobs,
  onJobScheduled
};
