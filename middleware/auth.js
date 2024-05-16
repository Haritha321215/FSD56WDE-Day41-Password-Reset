const jwt = require("jsonwebtoken");
const config = require("../utils/config");
const User = require("../user/userModel");
const auth = {
  verifyToken: (request, response, next) => {
    try {
      // get the token  the request cookies
      const token = request.cookies.token;
      if (!token) {
        return response.status(401).json({ message: "un authorised user" });
      }
      //verify the token
      try {
        const decodedToken = jwt.verify(token, config.JWT_SECRET);
        request.userId = decodedToken.id;
        // pass the controle and call the next middle ware
        next();
      } catch (error) {
        return response.status(401).json({ message: "Invalid token" });
      }
    } catch (error) {
      response.status(500).json({ message: error.message });
    }
  },
  isAdmin: async (request, response, next) => {
    try {
      // get the user id from request object
      const userId = request.userId;

      // get the user by id from database
      const user = await User.findById(userId);

      //if the user is not admin, return error
      if(user.role !== 'admin'){
        return response.status(403).json({message:"Forbidden"});
      }
      // if the user is admin, call the next middle ware
      next();
    } catch (error) {
      response.status(500).json({ message: error.message });
    }
  },
};

//exports auth module
module.exports = auth;
