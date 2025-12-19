const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");
async function createIssue(req, res) {
  try {
    const { title, description } = req.body;
    const { id } = req.params;

    const issue = new Issue({ title, description, repository: id });
    await issue.save();

    res.status(201).json(issue);
  } catch (err) {
    console.error("Error creating issue:", err.message);
    res.status(500).send("Server error");
  }
}

async function updateIssueById(req, res) {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ error: "Issue not found!" });

    issue.title = title || issue.title;
    issue.description = description || issue.description;
    issue.status = status || issue.status;

    await issue.save();
    res.json({ message: "Issue updated", issue });
  } catch (err) {
    console.error("Error updating issue:", err.message);
    res.status(500).send("Server error");
  }
}

async function deleteIssueById(req, res) {
  try {
    const { id } = req.params;
    const issue = await Issue.findByIdAndDelete(id);

    if (!issue) return res.status(404).json({ error: "Issue not found!" });
    res.json({ message: "Issue deleted" });
  } catch (err) {
    console.error("Error deleting issue:", err.message);
    res.status(500).send("Server error");
  }
}

async function getAllIssues(req, res) {
  try {
    const { id } = req.params;
    const issues = await Issue.find({ repository: id });

    res.status(200).json(issues);
  } catch (err) {
    console.error("Error fetching issues:", err.message);
    res.status(500).send("Server error");
  }
}

async function getIssueById(req, res) {
  const { id } = req.params;
  try {
    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ error: "Issue not found!" });
    }

    res.json(issue);
  } catch (err) {
    console.error("Error during issue updation : ", err.message);
    res.status(500).send("Server error");
  }
}

module.exports = {
  createIssue,
  updateIssueById,
  deleteIssueById,
  getAllIssues,
  getIssueById,
};
