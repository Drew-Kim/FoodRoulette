import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  email: {
    type: String,
    unique: true,
    sparse: true, // For Users don't have email
    trim: true
  },

  password: {
    type: String,
    required: function() {
      return !this.googleId; // Google Sign In doesn't require Password
    }
  },

  googleId: {
    type: String,
    unique: true,
    sparse: true // For Users don't have email
  },

  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  }
}, { timestamps: true });

UserSchema.pre('save', async function () {
  const user = this;
  
  // We check password if changed --> to restore
  if (!user.isModified('password')) return;

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    
  } catch (err) {
    throw err;
  }
});

// Compare passwords during login attempts
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; //If Using Google sign In, no password
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', UserSchema);