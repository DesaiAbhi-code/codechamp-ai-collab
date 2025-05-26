import { Router } from 'express';
import * as usercontroller from '../controller/user.controller.js'
import { body } from 'express-validator';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register',
    body('email').isEmail().withMessage('email must be a valid  email address'),
    body('password').isLength({ min: 3 }).withMessage('password must be atlest 3 character'),
    usercontroller.createusercontroller);


router.post('/login',
    body('email').isEmail().withMessage('Email must be a valid email address'),
    body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters long'),
    usercontroller.loginController);

router.get('/profile', authMiddleware.authUser, usercontroller.profileController);



router.get('/logout', authMiddleware.authUser, usercontroller.logoutController);


router.get('/all', authMiddleware.authUser, usercontroller.getAllUsersController);

export default router;
