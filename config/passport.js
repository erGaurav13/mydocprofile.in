const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const mongoose = require("mongoose");
const { sendWelcomeEmail } = require("../emailService/send.email");
module.exports = function (env) {
  const clientID = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const callbackURL = env.GOOGLE_CALLBACK_URL;

  if (!clientID || !clientSecret || !callbackURL) {
    console.warn(
      "Google OAuth environment variables not fully set. Skipping Google strategy configuration."
    );
  } else {
    passport.use(
      new GoogleStrategy(
        {
          clientID,
          clientSecret,
          callbackURL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const existing = await User.findOne({ googleId: profile.id });
            if (existing) return done(null, existing);

            const email =
              (profile.emails &&
                profile.emails[0] &&
                profile.emails[0].value) ||
              "";

            const user = await User.create({
              _id: new mongoose.Types.ObjectId().toString(),
              googleId: profile.id,
              displayName: profile.displayName,
              email,
              avatar:
                (profile.photos &&
                  profile.photos[0] &&
                  profile.photos[0].value) ||
                "",
            });
            sendWelcomeEmail({ to: email, name: profile.displayName });

            return done(null, user);
          } catch (err) {
            return done(err, null);
          }
        }
      )
    );
  }

  // Provide safe serialize/deserialize implementations. If strategy was skipped,
  // these will still allow session middleware to operate without throwing.
  passport.serializeUser((user, done) => {
    try {
      // if user is a mongoose doc use its id, else pass through
      const id = user && (user.id || user._id) ? user.id || user._id : user;
      done(null, id);
    } catch (err) {
      done(err);
    }
  });

  passport.deserializeUser(async (id, done) => {
    try {
      if (!id) return done(null, null);
      const user = await User.findById(id).lean();
      done(null, user || null);
    } catch (err) {
      // If DB isn't reachable or model not configured, return null user
      done(null, null);
    }
  });
};
