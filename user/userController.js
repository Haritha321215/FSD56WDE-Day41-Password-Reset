// business logic

// import the user model
const User = require("./userModel");

// import bcrypt
const bcrypt = require("bcrypt");

// import json web token
const jwt = require("jsonwebtoken");

//import config file
const config = require("../utils/config");

const nodemailer = require("nodemailer");

//define the user controller
const userController = {
  // register end point
  register: async (request, response) => {
    try {
      // response.send("Register a new user")

      // get the user inputs from the request body
      // to parse the json request body, we need to use middle ware
      // for that we can use express json / body parser
      // console.log(request.body);

      // destructure the request body
      const { username, password, name, location, role } = request.body;

      // checks if the user is already in the database
      // need to create user model
      const user = await User.findOne({ username });

      // if user exits, return an error
      //other wise create new user object and save it in db
      if (user) {
        return response.status(400).json({ message: "User already exists" });
      }

      // if user does not exits create new user
      // we should not store actual password, need to encode it by hashing
      // for hashing need to install bcrypt module, npm install bcrypt
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = new User({
        username,
        passwordHash,
        name,
        location,
        role,
      });

      // save the user in database
      const saveUser = await newUser.save();
      await User.collection.dropIndexes();

      // return the saved user respose to the front end
      response.status(201).json({
        message: "user created successfully",
        user: saveUser,
      });
    } catch (error) {
      response.status(500).json({ message: error.message });
    }
  },
  login: async (request, response) => {
    try {
      // get the username and pass from the request body
      // authentication
      const { username, password } = request.body;

      //check if the user exists in the database
      const user = await User.findOne({ username });

      // if user does not exits, return an error
      if (!user) {
        return response.status(400).json({ message: "User not found" });
      }

      // if the user exists check if the password is correct
      const isPasswordCorrect = await bcrypt.compare(
        password,
        user.passwordHash
      );

      //if the password is incorrect return error
      if (!isPasswordCorrect) {
        return response.status(400).json({ message: "Invalid credentials" });
      }

      // if the password is correct, generaye a token for the user and return it
      // for that we need JWTmodule by  npm i jsonwebtoken
      const token = jwt.sign(
        {
          username: user.username,
          id: user._id,
          name: user.name,
        },
        config.JWT_SECRET
      ); // create variable .env

      // set the cokies to handle secure authentication
      response.cookie("token", token, {
        httpOnly: true, // only accepts http
        sameSite: "none",
        expires: new Date(Date.now() + 24 * 60 * 1000), // 24 hours
        secure: true,
      });

      // return token
      response.json({ message: "login successful", token });
    } catch (error) {
      response.status(500).json({ message: error.message });
    }
  },

  forgotpassword: async (request, response) => {
    try {
      const { username } = request.body;
      //check if the user exists in the database
      const user = await User.findOne({ username });

      // if user does not exits, return an error
      if (!user) {
        return response
          .status(400)
          .json({ success: false, message: "User not found" });
      }
      console.log("userfound");
      const randomString = Math.random().toString(36).slice(2);
      user.resetPasswordToken = randomString;
      user.resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000 ;
      console.log("user.resetPasswordToken" + user.resetPasswordToken);
      await user.save();

      // Create a transporter with Gmail SMTP settings
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "yourgamil.com", // Your Gmail email address
          pass: "16 digit app specified password", // Your Gmail password or app-specific password
        },
      });

      // Send email
      const mailOptions = {
        from: "yourgamil.com", // Sender email address
        to: username, // Recipient email address
        subject: "Reset Password", // Email subject
        html: `Click <a href="http://localhost:5173/resetpassword/${randomString}">here</a> to reset your password.`, // Email body with reset link containing random string
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });

      // Return success message
      response.status(200).json({
        success: true,
        message: "Password reset link sent to your email",
      });
    } catch (error) {
      response.status(500).json({ message: error.message });
    }
  },
  resetpassword: async (request, response) => {
    try {
      const resetPasswordToken = request.params.resetPasswordToken; // Get new token from request object
      const { password } = request.body; // Get new password from request body
      console.log(resetPasswordToken);
      console.log(password);
      //check if the user exists in the database
      const user = await User.findOne({ resetPasswordToken });

      // If user not found or token expired, return error
      if (!user || user.resetPasswordExpires < Date.now()) {
        return response
          .status(400)
          .json({ success: false, message: "Invalid or expired token" });
      }
      console.log("userfound");

      // Hash the new password
      const passwordHash = await bcrypt.hash(password, 10);
      // Update user's password and clear reset token
      user.passwordHash = passwordHash;
      user.resetPasswordToken = "";
      user.resetPasswordExpires = "";
      await user.save();
      // Send success response
      response
        .status(200)
        .json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      response.status(500).json({ message: error.message });
    }
  },
  getUser: async (request, response) => {
    try {
      // get the user id  from the request object
      const userId = request.userId;
      // find the user by id from the database
      const user = await User.findById(userId).select(
        "-passwordHash -__v -_id"
      );

      // if the user does nt exist, return an error
      if (!user) {
        return response.status(400).json({ message: "User not found" });
      }
      //if the user found
      response.json({ message: "user found", user });
    } catch (error) {
      response.status(500).json({ message: error.message });
    }
  },
  updateUser: async (request, response) => {
    try {
      // get the user id  from the request object
      const userId = request.userId;
      // get user inputs from the requestbody
      const { name, location } = request.body;

      // find the user by id from the database
      const user = await User.findById(userId);

      // if the user does not exist, return an error
      if (!user) {
        return response.status(400).json({ message: "User not found" });
      }

      // update the user if the user exists
      if (name) user.name = name;
      if (location) user.location = location;

      //save the updated user to the database
      const updatedUser = await user.save();

      //return the updated user to front end
      response.json({ message: "user updated", user: updatedUser });
    } catch (error) {
      response.status(500).json({ message: error.message });
    }
  },
  deleteUser: async (request, response) => {
    try {
      // get the user id  from the request object
      const userId = request.userId;

      // find the user by id from the database
      const user = await User.findById(userId);
      if (!user) {
        return response.status(400).json({ message: "User not found" });
      }

      //if the user found, then delete the user
      await user.deleteOne();

      //return a suscess message
      response.json({ message: "user has been deleted" });
    } catch (error) {
      response.status(500).json({ message: error.message });
    }
  },
  logout: async (request, response) => {
    try {
      // clear the token cookie
      response.clearCookie("token");

      // return success message
      response.json({ message: "Logout susccessful" });
    } catch (error) {
      response.status(500).json({ message: error.message });
    }
  },
};

module.exports = userController;
