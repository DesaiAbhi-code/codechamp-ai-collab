import Project from "../models/project.model.js";
import * as ProjectService from "../services/project.service.js";
import { validationResult } from 'express-validator';
import userModel from "../models/user.model.js";


export const createProjectcontroller = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name } = req.body;

    // Log the user information
    //   console.log("User from token:", req.user);

    if (!req.user || !req.user.email) {
      return res.status(400).json({ errors: [{ msg: "User information is missing" }] });
    }

    const loggedInUser = await userModel.findOne({ email: req.user.email });

    if (!loggedInUser) {
      return res.status(404).json({ errors: [{ msg: "User not found" }] });
    }

    const userId = loggedInUser._id;

    const project = await ProjectService.createProject({ name, userId });

    res.status(201).json(project);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
};

export const getAllProjectsController = async (req, res) => {
  try {
    const loggedInUser = await userModel.findOne({ email: req.user.email });

    if (!loggedInUser) {
      return res.status(404).json({ errors: [{ msg: "User not found" }] });
    }

    const allUserProjects = await ProjectService.getAllProjects({ userId: loggedInUser._id });

    res.status(200).json({ projects: allUserProjects });

  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message })
  }



}


export const addUserToProject = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId, users } = req.body;

    const loggedInUser = await userModel.findOne({ email: req.user.email });


    const project = await ProjectService.addUsersToProject({ projectId, users, userId: loggedInUser._id });


    return res.status(200).json({
      project,
    })
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message })
  }


}


export const getProjectById = async (req, res) => {

  const { projectId } = req.params;

  try {

    const project = await ProjectService.getProjectById({ projectId });

    return res.status(200).json({
      project
    })

  } catch (err) {
    console.log(err)
    res.status(400).json({ error: err.message })
  }

}


export const updateFileTree = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {

    const { projectId, fileTree } = req.body;

    const project = await ProjectService.updateFileTree({
      projectId,
      fileTree
    })

    return res.status(200).json({
      project
    })

  } catch (err) {
    console.log(err)
    res.status(400).json({ error: err.message })
  }

}

export const deletefileTree = async (req, res) => {
  try {
    const { projectId, fileName } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Remove the file from the project file tree
    if (project.fileTree[fileName]) {
      delete project.fileTree[fileName];
      await project.save();
      return res.json({ message: "File deleted successfully", project });
    } else {
      return res.status(400).json({ message: "File not found" });
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}