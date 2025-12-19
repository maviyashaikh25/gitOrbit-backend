const express = require("express");
const dotenv = require("dotenv");
// Load environment variables immediately so other modules can use them when required
dotenv.config();

const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const http = require("http");
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const { initRepo } = require("./controllers/init.js");
const { addFile } = require("./controllers/add.js");
const { commitChanges } = require("./controllers/commit.js");
const { pushChanges } = require("./controllers/push.js");
const { pullRepo } = require("./controllers/pull.js");
const { revertChanges } = require("./controllers/revert.js");

const mainRouter = require("./routes/main.router.js");
// ...existing code...
yargs(hideBin(process.argv))
  .command("start", "Starting the server", {}, startServer)
  .command(
    "init",
    "Initialise a new repository",
    (yargs) => {
      yargs.option("name", {
        describe: "Repository name",
        type: "string",
        demandOption: true,
      });
    },
    (argv) => {
      initRepo(argv);
    }
  )
  .command(
    "add <file>",
    "add file in a repository ",
    (yargs) => {
      yargs.positional("file", {
        describe: "file to be added to stagging area ",
        type: "string",
      });
    },
    (argv) => {
      addFile(argv.file);
    }
  )

  .command(
    "commit <message>",
    "commit changes to the repository",
    (yargs) => {
      yargs.option("message", {
        describe: "commit message",
        type: "string",
        demandOption: true,
      });
    },
    (argv) => {
      commitChanges(argv.message);
    }
  )

  .command("push", "push changes to remote repository", {}, pushChanges)
  .command("pull", "pull changes from remote repository", {}, pullRepo)
  .command(
    "revert <commitId>",
    "revert changes in the repository",
    (yargs) => {
      yargs.positional("commitId", {
        describe: "commit id to revert changes",
        type: "string",
      });
    },
    (argv) => {
      revertChanges(argv.commitId);
    }
  )
  .demandCommand(1, "you need to enter atleast one command ")
  .help().argv;

function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(bodyParser.json());
  app.use(express.json());

  const mongoURL = process.env.MONGO_URL;
  if (mongoURL) {
    mongoose
      .connect(mongoURL)
      .then(() => console.log("MongoDB connected!"))
      .catch((err) => console.error("Unable to connect : ", err));
  } else {
    console.warn(
      "MONGO_URL not set — skipping MongoDB connection (running without DB)."
    );
  }

  app.use(cors({ origin: "*" }));
  app.use("/", mainRouter);
  app.get("/", (req, res) => {
    res.send("GitOrbit Backend is running");
  });

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  let user = "test";
  io.on("connection", (socket) => {
    socket.on("joinRoom", (userID) => {
      user = userID;
      console.log("=====");
      console.log(user);
      console.log("=====");
      socket.join(userID);
    });
  });

  // Use mongoose.connection to listen for DB events if a connection exists
  if (mongoose && mongoose.connection) {
    mongoose.connection.once("open", async () => {
      console.log("CRUD operations called");
      // CRUD operations
    });
  }

  httpServer.listen(port, () => {
    console.log(`Server is running on PORT ${port}`);
  });
}
