const jwt = require("jsonwebtoken");

// Secret key (store in environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Authentication Middleware
 * Extracts and verifies JWT token from Authorization header
 * Format: Bearer <token>
 */
const authenticateToken = (req, res, next) => {
  try {
    // Get the Authorization header
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];

    // Check if Authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format. Use: Bearer <token>",
      });
    }
    console.log("HI");
    // Verify the token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        // Different error messages based on token issue
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            message: "Token has expired. Please login again.",
          });
        }

        if (err.name === "JsonWebTokenError") {
          return res.status(401).json({
            success: false,
            message: "Invalid token.",
          });
        }
        console.log("BYE");
        return res.status(401).json({
          success: false,
          message: "Failed to authenticate token.",
        });
      }

      // Attach decoded user data to request object
      req.user = decoded;
      req.userId = decoded.userId || decoded.id;
      
      // Optional: Log user info (remove in production)
      console.log("Authenticated user:", req.user);

      // Proceed to next middleware/route handler
      next();
    });
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication.",
    });
  }
};

module.exports = {
  authenticateToken,
};
