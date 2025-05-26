import mongoose from "mongoose"; // MongoDB object modeling tool
import bcrypt from "bcrypt"; // Library for hashing passwords
import jwt from "jsonwebtoken"; // Library for creating and verifying JSON Web Tokens (JWT)

// Define the user schema
const userSchema = new mongoose.Schema({
    email: {
        type: String, // Email field is a string
        required: true, // Email is required
        unique: true, // Email is not unique (could be changed to true if necessary)
        trim: true, // Removes leading/trailing whitespace
        lowercase: true, // Converts the email to lowercase
        minLength: [6, 'Email must be at least 6 characters long'], // Minimum length validation
        maxLength: [50, 'Email must not be longer than 50 characters'] // Maximum length validation
    },
    password: {
        type: String, // Password field is a string
        select: false, // Excludes the password from query results by default
    }
});

// Static method to hash a password
userSchema.statics.hashpassword = async function (password) {
    return await bcrypt.hash(password, 10); // Hash the password with a salt round of 10
};

// Instance method to validate a password
userSchema.methods.isvalidpassword = async function (password) {
    return await bcrypt.compare(password, this.password); // Compare input password with hashed password
};

// Instance method to generate a JWT token
userSchema.methods.gjwt = function () {
    return jwt.sign(
        { email: this.email }, // Payload containing the user's email
        process.env.JWT_KEY // Secret key for signing the token
    );
};

const User = mongoose.model('user', userSchema); // Export the User model
export default User;
