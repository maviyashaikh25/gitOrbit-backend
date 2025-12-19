const path = require("path");
const fs = require("fs").promises;
const { s3, S3_BUCKET } = require("../config/aws-confiq.js");

async function pushChanges() {
  const repoPath = path.resolve(process.cwd(), ".mygitorbit");
  const commitsPath = path.join(repoPath, "commits");
  let repoName = null;
  try {
    // Read repoName from config.json
    const configRaw = await fs.readFile(
      path.join(repoPath, "config.json"),
      "utf-8"
    );
    const config = JSON.parse(configRaw);
    repoName = config.repoName;
    if (!repoName) {
      console.error(
        "No repoName found in .mygitorbit/config.json. Please re-init with a repo name."
      );
      return;
    }

    const commitDirs = await fs.readdir(commitsPath);
    for (const commitDir of commitDirs) {
      const commitPath = path.join(commitsPath, commitDir);
      const files = await fs.readdir(commitPath);

      for (const file of files) {
        const filePath = path.join(commitPath, file);
        const fileContent = await fs.readFile(filePath);
        const params = {
          Bucket: S3_BUCKET,
          Key: `${repoName}/commits/${commitDir}/${file}`,
          Body: fileContent,
        };

        await s3.upload(params).promise();
      }
    }

    console.log(`All commits for repo '${repoName}' pushed to S3.`);
  } catch (err) {
    console.error("Error pushing to S3 : ", err);
  }
}

module.exports = { pushChanges };
