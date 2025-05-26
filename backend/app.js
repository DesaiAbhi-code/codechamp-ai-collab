import express, { json } from 'express';
import connect from './db/db.js';
import userroute from './routes/user.routes.js';
import projectroute from './routes/project.routes.js';
import aiRoute from './routes/ai.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
connect();



const app = express(); 
const __dirname = path.resolve(); // Get the current directory name
app.use(express.static(path.join(__dirname, "/frontend/dist"))); // Serve static files from the 'public' directory
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.use('/user',userroute);
app.use('/project',projectroute);
app.use('/ai',aiRoute);

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html")); // Serve the index.html file for all other routes
});


export default app;