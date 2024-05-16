// import the express router
const express = require("express");
const userRouter = express.Router();
const userController = require("./userController");
const auth = require("../middleware/auth");
// define the end pointes

//POST/api/users/register : Register a new user
userRouter.post("/register", userController.register);

//POST/api/users/login : Register a new user
userRouter.post("/login", userController.login);
userRouter.post("/forgotpassword", userController.forgotpassword);

userRouter.post("/resetpassword/:resetPasswordToken", userController.resetpassword);

//GET/api/users/getUser : Get user
userRouter.get("/profile", auth.verifyToken, userController.getUser); //  protected-user needs to be authenticated
userRouter.put(
  "/profile",
  auth.verifyToken,
  auth.isAdmin,
  userController.updateUser
); // protected-user needs to be authenticated
userRouter.delete(
  "/profile",
  auth.verifyToken,
  auth.isAdmin,
  userController.deleteUser
); // protected-user needs to be authenticated

userRouter.get("/logout", auth.verifyToken, userController.logout); // user needs to be authenticated

//export the router
module.exports = userRouter;
