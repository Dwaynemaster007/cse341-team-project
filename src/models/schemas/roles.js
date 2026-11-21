import mongoose from 'mongoose';

const ROLE_NAMES = ['customer', 'admin'];

const roleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            enum: ROLE_NAMES,
            required: true,
            unique: true
        }
    },
    { timestamps: true }
);

const Role = mongoose.model('Role', roleSchema);

export { Role, ROLE_NAMES };
