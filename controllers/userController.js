const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const dotenv = require("dotenv");

dotenv.config();

// Using Mongoose models removes the need for explicit MongoClient connection management in controller
// The connection is handled in index.js via mongoose.connect

async function signup(req, res) {
  const { username, password, email } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        return res.status(400).json({ message: "Email already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user using Mongoose model
    const newUser = new User({ 
        username, 
        password: hashedPassword, 
        email,
        repositories: [],
        followedUsers: [],
        starRepos: []
    });

    const savedUser = await newUser.save();

    const token = jwt.sign(
      { id: savedUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );
    res.json({ token, userId: savedUser._id });
  } catch (err) {
    console.error("Error during signup:", err.message);
    res.status(500).send("Server error");
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });
    res.json({ token, userId: user._id });
  } catch (err) {
    console.error("Error during login : ", err.message);
    res.status(500).send("Server error!");
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    console.error("Error during fetching : ", err.message);
    res.status(500).send("Server error!");
  }
}

async function getUserProfile(req, res) {
  const currentID = req.params.id;

  try {
    // Populate useful fields for profile display
    const user = await User.findById(currentID)
        .populate('repositories')
        .populate('followedUsers')
        .populate('followers')
        .populate('starRepos');

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.send(user);
  } catch (err) {
    console.error("Error during fetching : ", err.message);
    res.status(500).send("Server error!");
  }
}

async function updateUserProfile(req, res) {
  const currentID = req.params.id;
  const { email, password, bio } = req.body;

  try {
    let updateFields = { email };
    if (bio) updateFields.bio = bio;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(
        currentID,
        { $set: updateFields },
        { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.send(updatedUser);
  } catch (err) {
    console.error("Error during updating : ", err.message);
    res.status(500).send("Server error!");
  }
}

async function deleteUserProfile(req, res) {
  const currentID = req.params.id;

  try {
    const result = await User.findByIdAndDelete(currentID);

    if (!result) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json({ message: "User Profile Deleted!" });
  } catch (err) {
    console.error("Error during updating : ", err.message);
    res.status(500).send("Server error!");
  }
}

async function followUser(req, res) {
    const currentUserID = req.body.currentUserID; // The user who is following
    const targetUserID = req.params.id; // The user to be followed

    // Check if trying to follow self
    if (currentUserID === targetUserID) {
        return res.status(400).json({ message: "You cannot follow yourself" });
    }

    try {
        const currentUser = await User.findById(currentUserID);
        const targetUser = await User.findById(targetUserID);

        if (!currentUser || !targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if already following
        if (currentUser.followedUsers.includes(targetUserID)) {
            return res.status(400).json({ message: "You are already following this user" });
        }

        // Add to followedUsers and followers lists
        currentUser.followedUsers.push(targetUserID);
        targetUser.followers.push(currentUserID);

        await currentUser.save();
        await targetUser.save();

        res.json({ message: "User followed successfully!" });

    } catch (err) {
        console.error("Error during follow : ", err.message);
        res.status(500).send("Server error!");
    }
}

async function unfollowUser(req, res) {
    const currentUserID = req.body.currentUserID; // The user who is unfollowing
    const targetUserID = req.params.id; // The user to be unfollowed

    try {
        const currentUser = await User.findById(currentUserID);
        const targetUser = await User.findById(targetUserID);

        if (!currentUser || !targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Remove from followedUsers and followers lists
        currentUser.followedUsers = currentUser.followedUsers.filter(
            (id) => id.toString() !== targetUserID
        );
        targetUser.followers = targetUser.followers.filter(
            (id) => id.toString() !== currentUserID
        );

        await currentUser.save();
        await targetUser.save();

        res.json({ message: "User unfollowed successfully!" });

    } catch (err) {
        console.error("Error during unfollow : ", err.message);
        res.status(500).send("Server error!");
    }
}


module.exports = {
  getAllUsers,
  signup,
  login,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  followUser,
  unfollowUser
};
