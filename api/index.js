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
app
  .listen(port, () => {
    console.log("Listening on port: ", port);
  })
  .setTimeout(1000 * process.env.TIMEOUT, () =>
    console.error("Request timed out.")
  );
