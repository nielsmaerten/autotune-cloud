const utils = require("./utilities");
const runAutotune = require("./run-autotune");
const generateOpenApsFiles = require("./generate-openaps-files");

async function handleRequest(/** @type Express.Request */ req, /** @type Express.Response*/ res) {
  // Merge user provided settings with defaults
  const settings = utils.getSettings(req);

  // Get latest NS reading, we only continue if the rig is online
  const isRigOnline = await utils.isRigOnline(settings, 15);
  if (!isRigOnline) {
    throw new Error(`
            ERROR: Your rig needs to be online.
            It hasn't uploaded data in the past 15 minutes.
        `);
  }

  // Prepare OpenAPS files (pumpprofile.json and profile.json)
  const openApsFiles = await generateOpenApsFiles(settings).catch(e =>
    onError(e, "generating openAPS files")
  );

  // Run Autotune
  let recommendations = await runAutotune(openApsFiles, settings).catch(e =>
    onError(e, "running autotune")
  );

  // Finish request
  console.log("Done.");
  return res.status(200).send(recommendations);
}

function onError(error, operation) {
  throw new Error(`
        ERROR: Something went wrong while ${operation}.
        Check logs and the error message below for more details:

        ${error}
    `);
}

module.exports = (req, res) => {
  return handleRequest(req, res).catch(e => {
    console.error(e);
    res.status(400).send("" + e);
  });
};
