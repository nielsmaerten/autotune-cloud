const path = require("path");

describe("Round profile blocks", () => {
  xit("reads a json file", () => {
    let dir = path.join(__dirname);
    require("../oref0/round-profile-blocks")({ maxDecimals: 2 }, dir);
  });
});
