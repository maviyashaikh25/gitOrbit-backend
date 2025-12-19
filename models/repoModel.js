const mongoose = require("mongoose");
const { Schema } = mongoose;

const RepositorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    language: {
        type: String,
        default: 'Plain Text'
    },
    content: [
      {
        type: { type: String, enum: ['file', 'dir'], default: 'file' },
        name: { type: String, required: true },
        path: { type: String, required: true },
        lastModified: { type: Date, default: Date.now }
      }
    ],
    startgazers: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: []
        }
    ],
    visibility: {
      type: Boolean,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    issues: [
      {
        type: Schema.Types.ObjectId,
        ref: "Issue",
      },
    ],
  },
  {
    timestamps: true, // ✅ moved here (second argument)
  }
);

const Repository = mongoose.model("Repository", RepositorySchema);
module.exports = Repository;
