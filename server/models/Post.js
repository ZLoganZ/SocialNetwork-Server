const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
    },
    url: {
      type: String,
    },
    status: {
      type: String,
      enum: ["TO LEARN", "LEARNING", "LEARNED"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: {
      type: Array,
      default: [],
    },
    comments: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

PostSchema.statics = {
  SavePost: async function (post) {
    const newPost = new this(post);
    return newPost.save();
  },
  GetPost: async function (id) {
    return this.findById(id);
  },
  GetPosts: async function () {
    return this.find();
  },
  UpdatePost: async function (id, post) {
    return this.updateOne({ _id: id }, { $set: post });
  },
  DeletePost: async function (id) {
    return this.deleteOne({ _id: id });
  },
};

const Post = mongoose.model("Post", PostSchema);

module.exports = {
  Post,
};
