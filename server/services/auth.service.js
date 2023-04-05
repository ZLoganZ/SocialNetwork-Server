const jwt = require("jsonwebtoken");
const { User } = require("../models/User");
const STATUS_CODE = require("../util/SettingSystem");
const client = require("../config/google-config");
const transporter = require("../config/email-config");
const crypto = require("crypto");

const cache = {
  get: (key) => cache[key],
  set: (key, value) => (cache[key] = value),
  del: (key) => delete cache[key],
};

const generateCode = (email) => {
  const code = crypto.randomBytes(3).toString("hex");
  const timestamp = Date.now();
  const expires = timestamp + 30 * 60 * 1000; // 30 minutes in milliseconds
  return {
    code,
    email,
    timestamp,
    expires,
  };
};

const storeCache = (email) => {
  const code = generateCode(email);
  cache.set(email, code);
  setTimeout(() => cache.del(email), 30 * 60 * 1000); // 30 minutes in milliseconds
  return code.code;
};

const fetchUserProfile = async (accessToken) => {
  const url = "https://www.googleapis.com/oauth2/v3/userinfo";
  const { data } = await client.request({
    url,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
};

const checkLogin_Service = async (accessToken) => {
  const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  const userID = decoded.id;

  const user = await User.findById(userID);
  if (!user) {
    return {
      status: STATUS_CODE.NOT_FOUND,
      success: false,
      message: "User does not exist!",
    };
  }
  if (user.accessToken !== accessToken) {
    return {
      status: STATUS_CODE.UNAUTHORIZED,
      success: false,
      message: "Have not logged in!",
    };
  }

  return {
    status: STATUS_CODE.SUCCESS,
    success: true,
    message: "User have logged in!",
  };
};

const login_Service = async (user) => {
  const { email, password } = user;

  // Check for invalid user
  const userFind = await User.checkEmail(email);

  if (!userFind) {
    return {
      status: STATUS_CODE.NOT_FOUND,
      success: false,
      message: "Email does not exist!",
    };
  }

  // Check for invalid password
  const validPassword = await userFind.checkPassword(password);
  if (!validPassword) {
    return {
      status: STATUS_CODE.BAD_REQUEST,
      success: false,
      message: "Invalid password!",
    };
  }

  // All good
  // Update secretKey to user
  const accessToken = await userFind.setToken();

  return {
    status: STATUS_CODE.SUCCESS,
    success: true,
    message: "User login successfully",
    content: {
      accessToken,
    },
  };
};

const login_Google_Callback_Service = async (code) => {
  const { tokens } = await client.getToken(code);

  client.setCredentials(tokens);

  // Use the access token to make API requests on behalf of the user
  const user = await fetchUserProfile(tokens.access_token);

  // Check user exist
  const userFind = await User.findOne({ email: user.email });

  if (!userFind) {
    const newUser = new User({
      email: user.email,
      firstname: user.given_name,
      lastname: user.family_name,
      userImage: user.picture,
      verified: user.email_verified,
    });
    await newUser.save();
    return {
      status: STATUS_CODE.SUCCESS,
      success: true,
      message: "User login successfully",
      content: {
        accessToken: newUser.accessToken,
      },
    };
  }

  // User exist
  const accessToken = jwt.sign(
    { id: userFind._id },
    process.env.ACCESS_TOKEN_SECRET
  );
  await User.updateOne({ email: user.email }, { accessToken: accessToken });

  return {
    status: STATUS_CODE.SUCCESS,
    success: true,
    message: "User login successfully",
    content: {
      accessToken: accessToken,
    },
  };
};

const logout_Service = async (accessToken) => {
  const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  const userID = decoded.id;

  const user = await User.findById(userID);
  if (!user) {
    return {
      status: STATUS_CODE.NOT_FOUND,
      success: false,
      message: "User does not exist!",
    };
  }

  if (user.accessToken !== accessToken) {
    return {
      status: STATUS_CODE.UNAUTHORIZED,
      success: false,
      message: "Have not logged in!",
    };
  }

  await User.updateOne({ _id: userID }, { accessToken: null });

  return {
    status: STATUS_CODE.SUCCESS,
    success: true,
    message: "User logout successfully",
  };
};

const forgot_password_Service = async (email) => {
  const user = await User.checkEmail(email);

  if (!user) {
    return {
      status: STATUS_CODE.NOT_FOUND,
      success: false,
      message: "Email does not exist!",
    };
  }

  //Save code to cache and get code
  const code = storeCache(email);

  //Send email
  await transporter.sendMailForgotPassword(email, code);

  return {
    status: STATUS_CODE.SUCCESS,
    success: true,
    message: "Send email successfully",
  };
};

const verify_code_Service = async (email, code) => {
  //Get code from cache
  const codeCache = cache.get(email);

  if (!codeCache) {
    return {
      status: STATUS_CODE.NOT_FOUND,
      success: false,
      message: "Code does not exist!",
    };
  }

  //Check code
  if (codeCache && codeCache.code === code && codeCache.expires > Date.now()) {
    return {
      status: STATUS_CODE.SUCCESS,
      success: true,
      message: "Code is valid",
    };
  } else {
    return {
      status: STATUS_CODE.BAD_REQUEST,
      success: false,
      message: "Code is invalid",
    };
  }
};

module.exports = {
  checkLogin_Service,
  login_Service,
  login_Google_Callback_Service,
  logout_Service,
  forgot_password_Service,
  verify_code_Service,
};
