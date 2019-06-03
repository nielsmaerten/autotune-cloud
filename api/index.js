// Dependency imports
const express = require("express"),
  fileUpload = require("express-fileupload");

// Constants
const port = process.env.PORT,
  app = express();

// Configure Express
app.use(fileUpload({ safeFileNames: true }));

app.post("/", require("./handle-incoming-request"));

// Start server
app.listen(port, () => {
  console.log("Listening on port: ", port);
});
