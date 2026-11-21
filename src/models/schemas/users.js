import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        displayName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 60
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            match: /^[a-z0-9._-]{3,30}$/
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        // Only the bcrypt hash is stored, never the plain-text password.
        passwordHash: {
            type: String,
            required: true
        },
        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            required: true
        }
    },
    { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
