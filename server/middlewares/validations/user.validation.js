const STATUS_CODE = require("../../util/SettingSystem");

const RegisterUser_checkEmpty = (req, res, next) => {
  const { firstname, lastname, email, password } = req.body;

  // Simple validation
  if (!firstname || !lastname || !email || !password) {
    return res.status(STATUS_CODE.SUCCESS).send({
      success: false,
      message: "Please enter all fields",
    });
  }
  next();
};

const LoginUser_checkEmpty = (req, res, next) => {
  const { email, password } = req.body;

  // Simple validation
  if (!email || !password) {
    return res.status(STATUS_CODE.SUCCESS).send({
      success: false,
      message: "Please enter all fields",
    });
  }
  next();
};

module.exports = {
  RegisterUser_checkEmpty,
  LoginUser_checkEmpty,
};
