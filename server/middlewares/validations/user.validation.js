const STATUS_CODE = require("../../util/SettingSystem");

const RegisterUser_checkEmpty = (req, res, next) => {
  const { firstname, lastname, email, password } = req.body;

  console.log(req.body);

  // Simple validation
  if (!firstname || !lastname || !email || !password) {
    return res
      .status(STATUS_CODE.BAD_REQUEST)
      .send({ success: false, message: "Please enter all fields" });
  }
  next();
};

module.exports = {
  RegisterUser_checkEmpty,
};
