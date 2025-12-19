const path = require("path");
const fs = require("fs").promises;

const axios = require("axios");

async function initRepo(argv) {
  // Accept repo name as argument (from yargs)
  const repoName = argv && argv.name ? argv.name : null;
  if (!repoName) {
    console.error(
      "Repository name is required. Use: node index.js init --name <repoName>"
    );
    return;
  }
  const repoPath = path.resolve(process.cwd(), ".mygitorbit");
  const commitsPath = path.join(repoPath, "commits");

  try {
    await fs.mkdir(repoPath, { recursive: true });
    await fs.mkdir(commitsPath, { recursive: true });
    await fs.writeFile(
      path.join(repoPath, "config.json"),
      JSON.stringify(
        {
          bucket: process.env.S3_BUCKET,
          repoName: repoName,
        },
        null,
        2
      )
    );
    console.log(
      `Initialized empty GitOrbit repository '${repoName}' in`,
      repoPath
    );

    // Also create the repo in the backend DB so it appears in the frontend
    // You may want to customize owner, description, etc. For now, use defaults.
    const payload = {
      name: repoName,
      description: "CLI created repo",
      visibility: true,
      owner: argv && argv.owner ? argv.owner : "cli-user", // fallback owner
      content: [],
      issues: [],
    };
    try {
      const response = await axios.post(
        "http://localhost:3000/repo/create",
        payload
      );
      if (response.status === 201) {
        console.log(
          "Repository also registered in backend DB (visible in frontend)."
        );
      } else {
        console.warn(
          "Repo local init succeeded, but backend DB registration failed."
        );
      }
    } catch (err) {
      console.warn(
        "Repo local init succeeded, but backend DB registration failed:",
        err.message
      );
    }
  } catch (error) {
    console.error("Error initializing repository:", error);
    return;
  }
}

module.exports = { initRepo };
