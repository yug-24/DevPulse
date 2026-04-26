import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.model.js';

export const configurePassport = () => {
  passport.use(
    new GitHubStrategy(
      {
        clientID:     process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL:  process.env.GITHUB_CALLBACK_URL,
        // Request extra scopes so we can read repos + stats
        scope: ['user:email', 'read:user', 'repo'],
        passReqToCallback: false,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Upsert: find by githubId or create a new user
          let user = await User.findOne({ githubId: profile.id });

          if (user) {
            // Refresh the access token on every login — it may have changed
            user.githubAccessToken = accessToken;
            user.name              = profile.displayName || profile.username;
            user.avatar            = profile.photos?.[0]?.value || user.avatar;
            user.githubProfile     = {
              login:     profile.username,
              url:       profile.profileUrl,
              followers: profile._json?.followers  || 0,
              following: profile._json?.following  || 0,
              publicRepos: profile._json?.public_repos || 0,
              bio:       profile._json?.bio,
              company:   profile._json?.company,
              location:  profile._json?.location,
            };
            user.lastLogin = new Date();
            await user.save();
          } else {
            user = await User.create({
              githubId:         profile.id,
              githubAccessToken: accessToken,
              username:          profile.username,
              name:              profile.displayName || profile.username,
              email:             profile.emails?.[0]?.value || null,
              avatar:            profile.photos?.[0]?.value || null,
              githubProfile: {
                login:       profile.username,
                url:         profile.profileUrl,
                followers:   profile._json?.followers    || 0,
                following:   profile._json?.following    || 0,
                publicRepos: profile._json?.public_repos || 0,
                bio:         profile._json?.bio,
                company:     profile._json?.company,
                location:    profile._json?.location,
              },
              lastLogin: new Date(),
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  // Not using sessions — JWT only
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id).select('-githubAccessToken');
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
