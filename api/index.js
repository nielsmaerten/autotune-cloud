// Dependency imports
const express = require("express"),
  fileUpload = require("express-fileupload");

// Constants
const port = process.env.PORT,
  app = express();

// Configure Express
app.use(fileUpload({ safeFileNames: true }));

app.get("/", require("./handle-incoming-request"));

// Start server
const TIMEOUT = 1000 * process.env.TIMEOUT;
app
  .listen(port, () => {
    console.log(`Spawned container with timeout of ${TIMEOUT / 1000} seconds.`);
  })
  .setTimeout(TIMEOUT, () => console.error("Request timed out."));
