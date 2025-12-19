const fs = require("fs").promises;
const path = require("path");

async function addFile(filePath) {
  const repoPath = path.resolve(process.cwd(), ".mygitorbit");
  const stagPath = path.join(repoPath, "staged");

  try {
    await fs.mkdir(stagPath, { recursive: true });
    const fileName = path.basename(filePath);
    await fs.copyFile(filePath, path.join(stagPath, fileName));

    console.log(`File ${fileName} added to staging area.`);
  } catch (err) {
    console.error("Error creating staging area:", err.message);
    return;
  }
}
module.exports = { addFile };
