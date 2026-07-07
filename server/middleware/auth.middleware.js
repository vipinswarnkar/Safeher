import jwt from "jsonwebtoken";
import User from "../models/user.js";

const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization Header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      // Verify Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get User (without password)
      req.user = await User.findById(decoded.id).select("-password");

      return next();
    }

    return res.status(401).json({
      success: false,
      message: "Not authorized. No token provided.",
    });

  } catch (error) {
    console.error("Auth Middleware:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid Token",
    });
  }
};

export default protect;