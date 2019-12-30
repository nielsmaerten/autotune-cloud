const generateOpenApsFiles = require("../generate-openaps-files");

describe("Fetch OpenAPS files", () => {
  it("gets all profiles from a ns site", async () => {
    generateOpenApsFiles({
      nsSite: "https://loop.niels.me",
      profileNames: {
        backup: "Backup Profile",
        autotune: "Autotune"
      },
      min5mCarbImpact: 8
    });
  });
});
