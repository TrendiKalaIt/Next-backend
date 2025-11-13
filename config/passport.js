const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        //  Check if a user already exists with this email
        let user = await User.findOne({ email });

        if (user) {
          //  If user exists but doesn't have googleId yet, link it
          if (!user.googleId) {
            user.googleId = profile.id;
            user.authProvider = "google";
            await user.save();
          }

          return done(null, user);
        }

        // If user doesn't exist, create new Google user
        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email,
          authProvider: "google",
          isVerified: true,
          password: null,
          mobile: null,
          profileImage: profile.photos?.[0]?.value || "",
        });

        await user.save({ validateBeforeSave: false });

        return done(null, user);
      } catch (error) {
        console.error("Google Auth Error:", error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

module.exports = passport;
