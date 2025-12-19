const express = require("express");
const repoController = require("../controllers/repoController");

const repoRouter = express.Router();

repoRouter.post("/repo/create", repoController.createRepository);
repoRouter.get("/repo/all", repoController.getAllRepositories);
repoRouter.get("/repo/:id", repoController.fetchRepositoryById);
repoRouter.get("/repo/name/:name", repoController.fetchRepositoryByName);
repoRouter.get(
  "/repo/user/:userID",
  repoController.fetchRepositoriesForCurrentUser
);
repoRouter.put("/repo/update/:id", repoController.updateRepositoryById);
repoRouter.delete("/repo/delete/:id", repoController.deleteRepositoryById);
repoRouter.patch("/repo/toggle/:id", repoController.toggleVisibilityById);
repoRouter.put("/repo/star/:id", repoController.toggleStarRepository);

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

repoRouter.post("/repo/upload/:id", upload.single("file"), repoController.uploadFile);
repoRouter.get("/repo/content/:id", repoController.getFileContent);

module.exports = repoRouter;
