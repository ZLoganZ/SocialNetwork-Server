const STATUS_CODE = require("../../util/SettingSystem");

const RegisterUser_checkEmpty = (req, res, next) => {
  const { name, email, password, userRole } = req.body;

  // Simple validation
  if (!email || !password) {
    return res
      .status(STATUS_CODE.BAD_REQUEST)
      .send({ success: false, message: "Please enter all fields" });
  }
  next();
};

module.exports = {
  RegisterUser_checkEmpty,
};
