import React from 'react'
import { Route, BrowserRouter, Routes } from 'react-router-dom';
import Login from '../Screen/Login';
import Home from '../Screen/Home';
import Register from '../Screen/Register';
import Project from '../Screen/Project';
import '../index.css'
import Userauth from '../Auth/Userauth';
const AppRouter = () => {
  return (

    <BrowserRouter>
      <div>
        <Routes>
          <Route path="/" element={<Userauth><Home /></Userauth>} />
          {/* <Route path="/" element={<Home />} /> */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/project" element={<Userauth><Project /></Userauth>} />
        </Routes>
      </div>
    </BrowserRouter>

  )
}

export default AppRouter
