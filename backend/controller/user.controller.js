import { validationResult } from 'express-validator';
import * as userservice from '../services/user.service.js';
import usermodel from '../models/user.model.js';
// import  redisClient from '../services/redis.service.js';
import jwt from "jsonwebtoken";

export const createusercontroller = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { email, password } = req.body;
        const user = await userservice.createuser(email, password);

        // Use the instance method
        const token = user.gjwt();
      
        delete user._doc.password;  // Remove the password field from the user object before sending it in the response
        res.status(201).json({ user, token });

    } catch (error) {
        res.status(400).json({ errors: error.message });
    }
};



export const loginController = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { email, password } = req.body;
        const user = await usermodel.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                errors: 'Invalid email'
            })
        }

        const isMatch = await user.isvalidpassword(password);  // Check if the provided password matches the stored password  use for instance method


        if (!isMatch) {
            return res.status(401).json({
                errors: 'Invalid Password'
            })
        }
        const token = user.gjwt();
        delete user._doc.password;  // Remove the password field from the user object before sending it in the response
        
        res.status(200).json({ user, token });
    } catch (error) {
        console.log(error)
        res.status(400).json({ errors: error.message });
    }
}


export const profileController = async (req, res) => {

    res.status(200).json({
        user: req.user
    });

}
// export const logoutController = async (req, res) => {
//     try {
//       const token =
//         req.cookies.token ||
//         (req.headers.authorization && req.headers.authorization.split(" ")[1]);
  
//       if (!token) {
//         return res.status(400).json({ success: false, error: "Token not provided" });
//       }
  
    
//       await redisClient.set(token, "logout", "EX", 60 * 60 * 24); // Set expiration to 24 hours
  
//       res.status(200).json({
//         success: true,
//         message: "Logged out successfully",
        
//       });
//     } catch (err) {
//       console.error(err);
//       res.status(400).json({ success: false, error: err.message });
//     }
//   };
  
export const logoutController = async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: "Logged out (no Redis used)",
      });
    } catch (err) {
      console.error(err);
      res.status(400).json({ success: false, error: err.message });
    }
};

  
export const getAllUsersController = async (req, res) => {
    try {

        const loggedInUser = await usermodel.findOne({
            email: req.user.email
        })

        const allUsers = await userservice.getAllUsers({ userId: loggedInUser._id });

        allUsers.forEach(user => {
            delete user._doc.password
        })

        return res.status(200).json({
            users: allUsers
        })

    } catch (err) {

        console.log(err)

        res.status(400).json({ error: err.message })

    }
}
