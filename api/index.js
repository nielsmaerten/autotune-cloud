// Dependency imports
const express = require("express"),
  cors = require('cors')
  fileUpload = require("express-fileupload");

// Constants
const port = process.env.PORT,
  app = express();

// Configure Express
app.use(fileUpload({ safeFileNames: true }));
app.use(cors());

app.get("/api/v2/run-autotune", require("./v2/main"));

// Start server
const TIMEOUT = 1000 * process.env.TIMEOUT;
app
  .listen(port, () => {
    console.log(`Spawned container with timeout of ${TIMEOUT / 1000} seconds.`);
  })
  .setTimeout(TIMEOUT, () => console.error("Request timed out."));
