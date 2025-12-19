const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");
const { s3, S3_BUCKET } = require("../config/aws-confiq.js");

async function createRepository(req, res) {
  const { owner, name, issues, content, description, visibility } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ error: "Repository name is required!" });
    }

    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ error: "Invalid User ID!" });
    }

    const newRepository = new Repository({
      name,
      description,
      visibility,
      owner,
      content,
      issues,
    });

    const result = await newRepository.save();

    res.status(201).json({
      message: "Repository created!",
      repositoryID: result._id,
    });
  } catch (err) {
    console.error("Error during repository creation : ", err.message);
    res.status(500).send("Server error");
  }
}

async function getAllRepositories(req, res) {
  try {
    const repositories = await Repository.find({})
      .populate("owner")
      .populate("issues");

    res.json(repositories);
  } catch (err) {
    console.error("Error during fetching repositories : ", err.message);
    res.status(500).send("Server error");
  }
}
async function fetchRepositoryById(req, res) {
  const { id } = req.params;
  try {
    const repository = await Repository.findById(id)
      .populate("owner")
      .populate("issues");
    if (!repository)
      return res.status(404).json({ error: "Repository not found!" });
    res.json(repository);
  } catch (err) {
    console.error("Error fetching repository:", err.message);
    res.status(500).send("Server error");
  }
}

async function updateRepositoryById(req, res) {
  const { id } = req.params;
  const { content, description } = req.body;

  try {
    const repository = await Repository.findById(id);
    if (!repository)
      return res.status(404).json({ error: "Repository not found!" });

    if (content) repository.content.push(content);
    if (description) repository.description = description;

    const updated = await repository.save();
    res.json({
      message: "Repository updated successfully!",
      repository: updated,
    });
  } catch (err) {
    console.error("Error updating repository:", err.message);
    res.status(500).send("Server error");
  }
}

async function fetchRepositoryByName(req, res) {
  const { name } = req.params;
  try {
    const repository = await Repository.find({ name })
      .populate("owner")
      .populate("issues");

    res.json(repository);
  } catch (err) {
    console.error("Error during fetching repository : ", err.message);
    res.status(500).send("Server error");
  }
}

async function fetchRepositoriesForCurrentUser(req, res) {
  console.log(req.params);
  const { userID } = req.params;

  try {
    const repositories = await Repository.find({ owner: userID });

    if (!repositories || repositories.length == 0) {
      return res.status(404).json({ error: "User Repositories not found!" });
    }
    console.log(repositories);
    res.json({ message: "Repositories found!", repositories });
  } catch (err) {
    console.error("Error during fetching user repositories : ", err.message);
    res.status(500).send("Server error");
  }
}

async function toggleVisibilityById(req, res) {
  const { id } = req.params;

  try {
    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    repository.visibility = !repository.visibility;

    const updatedRepository = await repository.save();

    res.json({
      message: "Repository visibility toggled successfully!",
      repository: updatedRepository,
    });
  } catch (err) {
    console.error("Error during toggling visibility : ", err.message);
    res.status(500).send("Server error");
  }
}

async function deleteRepositoryById(req, res) {
  const { id } = req.params;
  try {
    const repository = await Repository.findByIdAndDelete(id);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    res.json({ message: "Repository deleted successfully!" });
  } catch (err) {
    console.error("Error during deleting repository : ", err.message);
    res.status(500).send("Server error");
  }
}

async function toggleStarRepository(req, res) {
    const { id } = req.params; // Repository ID
    const { userID } = req.body; // User ID who is toggling star

    try {
        const repository = await Repository.findById(id);
        const user = await User.findById(userID);

        if (!repository || !user) {
            return res.status(404).json({ error: "Repository or User not found!" });
        }

        // Check if user already starred this repo
        if (user.starRepos.includes(id)) {
            // Unstar
            user.starRepos = user.starRepos.filter(repoId => repoId.toString() !== id);
            repository.startgazers = repository.startgazers.filter(userId => userId.toString() !== userID);
        } else {
            // Star
            user.starRepos.push(id);
            repository.startgazers.push(userID);
        }

        await user.save();
        await repository.save();

        res.json({ message: "Star toggled successfully!" });
    } catch (err) {
        console.error("Error during checking star : ", err.message);
        res.status(500).send("Server error");
    }

}

async function uploadFile(req, res) {
    const { id } = req.params; // Repo ID
    const file = req.file;
    const { path: relativePath } = req.body; // Path inside repo, e.g., "src/components" or just ""

    if (!file) {
        return res.status(400).json({ error: "No file uploaded!" });
    }

    try {
        const repository = await Repository.findById(id);
        if (!repository) {
            return res.status(404).json({ error: "Repository not found!" });
        }

        // Construct S3 Key: repos/<repoID>/<path>/<filename>
        // Ensure path doesn't start with /
        const infoPath = relativePath ? (relativePath.startsWith('/') ? relativePath.slice(1) : relativePath) : "";
        const s3Key = `repos/${id}/${infoPath ? infoPath + '/' : ''}${file.originalname}`;

        const params = {
            Bucket: S3_BUCKET,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype
        };

        await s3.upload(params).promise();

        // Update DB
        const fileRecord = {
            name: file.originalname,
            path: infoPath ? `${infoPath}/${file.originalname}` : file.originalname,
            type: 'file',
            lastModified: new Date()
        };

        // Check if file already exists in content array to avoid duplicates
        const existingIndex = repository.content.findIndex(f => f.path === fileRecord.path);
        if (existingIndex !== -1) {
            repository.content[existingIndex] = fileRecord;
        } else {
            repository.content.push(fileRecord);
        }
        
        // Update language based on file extension
        const ext = file.originalname.split('.').pop().toLowerCase();
        const languageMap = {
            'js': 'JavaScript',
            'jsx': 'JavaScript',
            'ts': 'TypeScript',
            'tsx': 'TypeScript',
            'py': 'Python',
            'java': 'Java',
            'cpp': 'C++',
            'c': 'C',
            'html': 'HTML',
            'css': 'CSS',
            'json': 'JSON',
            'md': 'Markdown',
            'go': 'Go',
            'rs': 'Rust',
            'php': 'PHP',
            'rb': 'Ruby',
            'sql': 'SQL',
            'txt': 'Plain Text',
            'ipynb': 'Jupyter Notebook'
        };
        
        // Simple logic: If it's a code file, update the language. 
        // You might want "majority language" logic later, but "latest upload" is good for now.
        if (languageMap[ext]) {
            repository.language = languageMap[ext];
        }

        await repository.save();

        res.json({ message: "File uploaded successfully!", file: fileRecord });

    } catch (err) {
        console.error("Error uploading file:", err);
        res.status(500).json({ error: "Server error during upload" });
    }
}

async function getFileContent(req, res) {
    const { id } = req.params; // Repo ID
    const { path: filePath } = req.query; // Full path of file in repo, e.g. "src/index.js"

    if (!filePath) {
        return res.status(400).json({ error: "File path is required!" });
    }
    
    try {
        const repository = await Repository.findById(id);
        if (!repository) return res.status(404).json({ error: "Repository not found!" });

         const s3Key = `repos/${id}/${filePath}`;
         
        //  Generate Signed URL for direct access (valid for 1 hour)
        const signedUrl = s3.getSignedUrl('getObject', {
            Bucket: S3_BUCKET,
            Key: s3Key,
            Expires: 60 * 60
        });

         const params = {
            Bucket: S3_BUCKET,
            Key: s3Key
        };

        const data = await s3.getObject(params).promise();
        
        // Return content. If it's text, we can convert toString. 
        // For simplicity, we assume text files for code viewing.
        // Images might need different handling, but let's send data back.
        res.json({ 
            content: data.Body.toString('utf-8'),
            downloadUrl: signedUrl 
        });

    } catch (err) {
        console.error("Error fetching file content:", err);
        res.status(500).json({ error: "Failed to fetch file content" });
    }
}

module.exports = {
  createRepository,
  getAllRepositories,
  fetchRepositoryById,
  fetchRepositoryByName,
  fetchRepositoriesForCurrentUser,
  updateRepositoryById,
  toggleVisibilityById,
  deleteRepositoryById,
  toggleStarRepository,
  uploadFile,
  getFileContent
};
