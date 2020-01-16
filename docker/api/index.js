// Dependency imports
const express = require("express");
const cors = require("cors");

// Constants
const port = process.env.PORT;
const app = express();

// Configure Express
app.use(cors());

// Bind handlers
app.get("/api/v2/run-autotune", require("./v2/main"));

// Start server
const TIMEOUT = 1000 * process.env.TIMEOUT;
app
  .listen(port, () => {
    console.log(`Spawned container with timeout of ${TIMEOUT / 1000} seconds.`);
  })
  .setTimeout(TIMEOUT, () => {
    console.error(
      "Express server timeout. This shouldn't happen!",
      "The requests should time out internally and exit gracefully."
    );
  });
