// Simple auth controller helpers
const { createToken } = require("../utils/jwt");

exports.authSuccess = (req, res) => {
  // If user is authenticated, create a JWT and redirect the user to frontend with the token
  if (req.user) {
    // send minimal user info
    const { _id, displayName, email, avatar } = req.user;
    const payload = { id: _id || req.user.id, displayName, email, avatar };
    // create a token (default expiry 1h). You can customize expiresIn if needed.
    const token = createToken(payload);

    // Use FRONTEND_URL env if provided, otherwise default to localhost:5173
    const redirectTo = process.env.FRONTEND_URL;
    const url = `${redirectTo}?token=${encodeURIComponent(token)}`;
    return res.redirect(url);
  }
  res.redirect("/");
};

exports.authFailure = (req, res) => {
  res.status(401).json({ error: "Authentication failed" });
};

// let User;
// try {
//   User = require("../models/User");
// } catch (e) {
//   User = null;
// }

// // In-memory fallback store for development when DB isn't available
// const _mockStore = new Map();

// // Development/testing helper: create or find a user and establish a session without real OAuth.
// exports.authMock = async (req, res) => {
//   const { googleId, displayName, email, avatar } = req.body || {};
//   if (!googleId)
//     return res
//       .status(400)
//       .json({ error: "googleId is required for mock login" });

//   try {
//     if (User) {
//       // Try DB-backed flow first
//       let user;
//       try {
//         user = await User.findOne({ googleId });
//         if (!user) {
//           user = await User.create({ googleId, displayName, email, avatar });
//         }
//       } catch (dbErr) {
//         // If DB operations fail, fallback to in-memory store
//         console.warn(
//           "User DB access failed, using in-memory fallback for mock auth:",
//           dbErr.message
//         );
//       }

//       if (user) {
//         return req.login(user, (err) => {
//           if (err)
//             return res
//               .status(500)
//               .json({ error: "Failed to establish session" });
//           const { _id, displayName: name, email: e, avatar: av } = user;
//           return res.json({
//             user: { id: _id, displayName: name, email: e, avatar: av },
//           });
//         });
//       }
//     }

//     // In-memory fallback path
//     let mem = _mockStore.get(googleId);
//     if (!mem) {
//       mem = { id: `mem-${Date.now()}`, googleId, displayName, email, avatar };
//       _mockStore.set(googleId, mem);
//     }

//     req.login(mem, (err) => {
//       if (err)
//         return res.status(500).json({ error: "Failed to establish session" });
//       const { id, displayName: name, email: e, avatar: av } = mem;
//       return res.json({
//         user: { id, displayName: name, email: e, avatar: av },
//       });
//     });
//   } catch (err) {
//     console.error("authMock error:", err);
//     res.status(500).json({ error: "Internal error" });
//   }
// };
