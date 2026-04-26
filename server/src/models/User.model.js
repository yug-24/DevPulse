import mongoose from 'mongoose';

const githubProfileSchema = new mongoose.Schema(
  {
    login:       { type: String },
    url:         { type: String },
    followers:   { type: Number, default: 0 },
    following:   { type: Number, default: 0 },
    publicRepos: { type: Number, default: 0 },
    bio:         { type: String, default: null },
    company:     { type: String, default: null },
    location:    { type: String, default: null },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    githubId: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },
    // Stored encrypted at rest in Atlas — never returned to client
    githubAccessToken: {
      type:   String,
      select: false, // Never returned in queries by default
    },
    username: {
      type:     String,
      required: true,
      trim:     true,
      index:    true,
    },
    name: {
      type:  String,
      trim:  true,
      default: '',
    },
    email: {
      type:      String,
      lowercase: true,
      trim:      true,
      default:   null,
    },
    avatar: {
      type:    String,
      default: null,
    },
    githubProfile: {
      type:    githubProfileSchema,
      default: () => ({}),
    },
    // Cached analytics — updated on each dashboard load
    cachedStats: {
      type:    mongoose.Schema.Types.Mixed,
      default: null,
      select:  false,
    },
    cachedAt: {
      type:    Date,
      default: null,
      select:  false,
    },
    // Public shareable profile
    isPublic: {
      type:    Boolean,
      default: false,
    },
    shareSlug: {
      type:    String,
      unique:  true,
      sparse:  true, // Allows multiple null values
      default: null,
    },
    lastLogin: {
      type:    Date,
      default: Date.now,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        delete ret.githubAccessToken;
        delete ret.cachedStats;
        delete ret.cachedAt;
        return ret;
      },
    },
  }
);

// Public profile — what's safe to send to the client
userSchema.methods.toPublicProfile = function () {
  return {
    _id:           this._id,
    username:      this.username,
    name:          this.name,
    email:         this.email,
    avatar:        this.avatar,
    githubProfile: this.githubProfile,
    isPublic:      this.isPublic,
    shareSlug:     this.shareSlug,
    lastLogin:     this.lastLogin,
    createdAt:     this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);
export default User;
