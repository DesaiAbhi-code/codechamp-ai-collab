import { Router } from "express";
import * as projectController from "../controller/Project.controller.js";
import { body } from "express-validator";
import * as authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.post('/create',
    authMiddleware.authUser,
    body('name').isString().withMessage('Name is required'),
    projectController.createProjectcontroller);


router.get('/all',
    authMiddleware.authUser,
    projectController.getAllProjectsController);

router.put('/add-user',
    authMiddleware.authUser,
    body('projectId').isString().withMessage('Project id is required'),
    body('users').isArray({min:1}).withMessage('Users must be an array of Strings').bail()
    .custom((users)=> users.every(user=> typeof user === 'string')).withMessage('Users must be an  Strings'),
    projectController.addUserToProject
)

router.get('/get-project/:projectId',
    authMiddleware.authUser,
    projectController.getProjectById
)

router.put('/update-file-tree',
    authMiddleware.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('fileTree').isObject().withMessage('File tree is required'),
    projectController.updateFileTree
)

router.delete('/delete-file',
    authMiddleware.authUser,
    projectController.deletefileTree
)

export default router;