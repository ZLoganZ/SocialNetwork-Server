const mongoose = require("mongoose");
const argon2 = require("argon2");
const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
require("./Share");
require("./Post");

const UserSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
      maxlength: 32,
    },
    lastname: {
      type: String,
      required: true,
      maxlength: 32,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      index: { unique: true },
    },
    password: {
      type: String,
    },
    userRole: {
      type: Number,
      required: true,
      default: 1,
    },
    phoneNumber: {
      type: Number,
    },
    userImage: {
      type: String,
      default: null,
    },
    verified: {
      type: String,
      default: false,
    },
    description: {
      type: [{ type: String }],
      default: null,
    },
    accessToken: {
      type: String,
      default: null,
    },
    followers: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    following: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    shares: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Share" }],
      default: [],
    },
    favorites: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
      default: [],
    },
  },
  { timestamps: true }
);

UserSchema.methods = {
  CheckPassword: async function (password) {
    return await argon2.verify(this.password, password);
  },
  SetToken: async function () {
    const accessToken = await promisify(jwt.sign)(
      { id: this._id },
      process.env.ACCESS_TOKEN_SECRET
    );
    this.accessToken = accessToken;
    await this.save();
    return accessToken;
  },
  SaveShare: async function (share) {
    this.shares.push(share);
    return this.save();
  },
  RemoveShare: async function (shareID) {
    this.shares.pull(shareID);
    return this.save();
  },
  SaveFavorite: async function (post) {
    this.favorites.push(post);
    return this.save();
  },
  RemoveFavorite: async function (postID) {
    this.favorites.pull(postID);
    return this.save();
  },
  GetShares: async function () {
    return this.populate("shares");
  },
};

UserSchema.statics = {
  CheckEmail: async function (email) {
    const user = await this.findOne({ email: email });
    return user === null ? false : user;
  },
  UpdateUser: async function (id, data) {
    return this.findOneAndUpdate({ _id: id }, { $set: data });
  },
  GetUser: async function (id) {
    return this.findById(id);
  },
  GetAllUsers: async function () {
    return this.find();
  },
};

UserSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) return next();

  const salt = crypto.randomBytes(32);
  const hash = await argon2.hash(user.password, salt);
  user.password = hash;
  next();
});

UserSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("password")) {
    // Generate a new access token
    const accessToken = await promisify(jwt.sign)(
      { id: this._id },
      process.env.ACCESS_TOKEN_SECRET
    );

    // Save the access token to the user document
    this.accessToken = accessToken;
  }

  next();
});

UserSchema.pre("updateOne", async function (next) {
  if (this.getUpdate().$set.password) {
    try {
      const salt = crypto.randomBytes(32);
      const hashedPassword = await argon2.hash(
        this.getUpdate().$set.password,
        salt
      );
      this.getUpdate().$set.password = hashedPassword;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = {
  User: mongoose.model("User", UserSchema),
};
