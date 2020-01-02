const sinon = require("sinon");

describe("Profile upload", () => {
  before(() => {
    // Stub roundProfileBlocks()
    delete require.cache[require.resolve("../oref0/round-profile-blocks")];
    require.cache[require.resolve("../oref0/round-profile-blocks")] = {
      exports: () => {
        return require("./settings/profile.json");
      }
    };

    // Stub axios.put
    sinon.stub(require("axios").default, "put").resolves();
  });
  it("gets current profiles from NS", () => {
    const uploadProfile = require("../oref0/profile-upload");
    uploadProfile(
      {
        nsSite: "https://loop.niels.me",
        nsSecret: "",
        profileNames: {
          autotune: "Autotune",
          backup: "Backup Profile"
        }
      },
      ""
    );
  });
});
