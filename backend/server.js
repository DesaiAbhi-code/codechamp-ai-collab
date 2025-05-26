import 'dotenv/config'
import app from './app.js';
import { Server } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import ProjectModel from "./models/project.model.js";
import { send } from 'process';
import { generateResult } from './services/ai.service.js';

const port = process.env.PORT || 8000;

const server = http.createServer(app); // WebSocket requires an HTTP server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
    const projectId = socket.handshake.query.projectId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error("Project ID is invalid"));
    }

    socket.project = await ProjectModel.findById(projectId);

    if (!token) {
      return next(new Error("Authentication error"));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    socket.user = decoded;

    next();
  }
  catch (error) {
    console.log(error);
    next(error);
  }
});



io.on('connection', (socket) => {   // io no means ke badha user mate 
  socket.roomsId = socket.project._id;

  socket.join(socket.roomId);

  socket.on('project-message', async data => {
    // console.log(data);
    const message = data.message; /// je message send kare che te message ne store kare che 

    const aiIsPresentInMessage = message.includes('@ai');  // check kare che ke message ma @ai present che ke nai
    socket.broadcast.to(socket.roomId).emit('project-message', data)  /// ano means e che ke ke project ma other user add che tene j message show thay and na ke je use message kare che tene j message show thay ok

    if (aiIsPresentInMessage) {  // je message ma @ai present  ma hoy to aa display thay

      const prompt = message.replace('@ai', '');  // remove the @ai from the message
      const result = await generateResult(prompt);  // generate the result from the prompt

      // console.log(result)

      io.to(socket.roomId).emit('project-message', {   // io.to no means ke jetla pan user che te badha ne show thay and jo sockt.emit hoy to khali one user ne j show thy.
        message: result,
        sender: {
          _id: 'ai',
          email: 'AI'
        }

      });


      return;

    }

  }
  );

  socket.on('disconnect', () => {
    console.log("WebSocket disconnected");
    socket.leave(socket.roomId)
  });

  console.log("WebSocket connection established");

});

server.listen(port, () => {
  console.log(`Server are listing port no ${port}`);
})