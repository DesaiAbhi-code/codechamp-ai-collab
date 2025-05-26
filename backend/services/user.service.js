import usermodel from '../models/user.model.js';

export const createuser = async (email, password) => {
    if (!email || !password) {
        throw new Error('Email and password must be required');
    }

    const hashpassword = await usermodel.hashpassword(password);
    const user = await usermodel.create({ email, password: hashpassword });
   
   
    return user;
};

export const getAllUsers = async ({ userId }) => {
    const users = await usermodel.find({
        _id: { $ne: userId }
    });

    
    return users;
}
