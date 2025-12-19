const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
async function commitChanges(message) {
  const repoPath = path.resolve(process.cwd(), ".mygitorbit");
  const stagPath = path.join(repoPath, "staged");
  const commitPath = path.join(repoPath, "commits");

  try {
    const commitId = uuidv4();
    const commitDir = path.join(commitPath, commitId);
    await fs.mkdir(commitDir, { recursive: true });

    const files = await fs.readdir(stagPath);
    for (const file of files) {
      await fs.copyFile(path.join(stagPath, file), path.join(commitDir, file));
    }

    await fs.writeFile(
      path.join(commitDir, "commit.json"),
      JSON.stringify({ message, date: new Date().toISOString() })
    );

    console.log(`Commit created with id ${commitId} and message "${message}"`);
  } catch (err) {
    console.error("Error creating commit:", err.message);
  }
}

module.exports = { commitChanges };
