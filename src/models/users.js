import bcrypt from 'bcrypt';
import User from './schemas/users.js';
import { Role } from './schemas/roles.js';

const SALT_ROUNDS = 12;

/**
 * Creates a new user. Public registration always receives the customer role;
 * the browser never chooses its own role.
 */
const createUser = async ({ displayName, username, email, password }) => {
    const customerRole = await Role.findOne({ name: 'customer' });

    if (!customerRole) {
        throw new Error('Default customer role not found. Run npm run db:roles.');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
        displayName,
        username,
        email,
        passwordHash,
        role: customerRole._id
    });

    return user._id.toString();
};

const findUserByEmail = async (email) => {
    return User.findOne({ email: email.trim().toLowerCase() }).populate('role');
};

const verifyPassword = async (password, passwordHash) => {
    return bcrypt.compare(password, passwordHash);
};

/**
 * Changes a user's role by email. Used by the db:make-admin script, not by any route.
 */
const setUserRole = async (email, roleName) => {
    const role = await Role.findOne({ name: roleName });

    if (!role) {
        throw new Error(`Role "${roleName}" not found. Run npm run db:roles.`);
    }

    return User.findOneAndUpdate(
        { email: email.trim().toLowerCase() },
        { role: role._id },
        { returnDocument: 'after' }
    ).populate('role');
};

export { createUser, findUserByEmail, verifyPassword, setUserRole };
