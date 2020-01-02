const functions = require('firebase-functions');

functions.pubsub.schedule("every 15 minutes").onRun(require("./jobs/scheduler"));
functions.firestore.document("jobs/{jobId}").onCreate(require("./jobs/on-job-scheduled"));