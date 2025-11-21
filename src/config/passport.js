import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
dotenv.config();
console.log("GOOGLE ENV CHECK:", {
  id: process.env.GOOGLE_CLIENT_ID,
  secret: !!process.env.GOOGLE_CLIENT_SECRET,
  callback: process.env.GOOGLE_CALLBACK_URL,
});

import { findOrCreateByGoogle } from "../services/user.service.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateByGoogle({
          username: profile.displayName,
          email: profile.emails?.[0]?.value,
          google_id: profile.id,
        });
        return done(null, user);
      } catch (err) {
        console.error("❌ Google Auth Error:", err);
        return done(err, null);
      }
    }
  )
);
export default passport;
console.log(
  " Passport GoogleStrategy initialized:",
  passport._strategy("google") ? "YES" : "NO"
);
