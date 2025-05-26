// import React, { useState,useContext } from "react";
// import { Link , useNavigate} from "react-router-dom"; // Import Link from react-router-dom
// import axios from "../config/Axios";
// import { UserContext } from "../Context/User.context";
// const Login = () => {


//   const [email, setEmail] = useState();
//   const [password, setPassword] = useState();
//   const navigate = useNavigate()

//   const {setUser } = useContext(UserContext);

//   function handler(e) {
//     e.preventDefault();

//     axios.post('/user/login', { email, password })
//     .then((res) => {
//       localStorage.setItem('token', res.data.token);
//       setUser(res.data.user);
//       // console.log(res.data);
//       // console.log(res.data.token)
//       // console.log(user)
//       navigate('/')
      
//     }).catch((err) => {
//       console.log(err);
//     })

//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-900">
//       <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
//         <h2 className="text-3xl font-bold text-center text-white">Login</h2>
//         <form className="space-y-4"
//           onSubmit={handler}>
//           <div>
//             <label htmlFor="email" className="block text-sm font-medium text-gray-300">
//               Email Address
//             </label>
//             <input
//               onChange={(e) => setEmail(e.target.value)}
//               type="email"
//               id="email"
//               name="email"
//               required
//               className="w-full px-4 py-2 mt-1 text-gray-900 bg-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
//               placeholder="Enter your email"
//             />
//           </div>
//           <div>
//             <label htmlFor="password" className="block text-sm font-medium text-gray-300">
//               Password
//             </label>
//             <input
//               onChange={(e) => setPassword(e.target.value)}
//               type="password"
//               id="password"
//               name="password"
//               required
//               className="w-full px-4 py-2 mt-1 text-gray-900 bg-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
//               placeholder="Enter your password"
//             />
//           </div>
//           <button
//             type="submit"
//             className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
//           >
//             Login
//           </button>
//         </form>
//         <p className="text-sm text-center text-gray-400">
//           Don't have an account?{" "}
//           <Link to="/register" className="text-blue-500 hover:underline">
//             Create one
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Login;
import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../config/Axios";
import { UserContext } from "../Context/User.context";
import bg from "../assets/images/AI_Enabled_Chatbot_for_Customer_Management_Benefits_and_Integration_Process_82e6ccb319.webp";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  function handler(e) {
    e.preventDefault();

    axios.post('/user/login', { email, password })
      .then((res) => {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        navigate('/');
      })
      .catch((err) => {
        if (err.response && err.response.data && err.response.data.message) {
          setErrorMsg(err.response.data.message);
        } else {
          setErrorMsg("Login failed. Please try again.");
        }
      });
  }

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center flex items-center justify-center px-4 sm:px-6 lg:px-8"
       style={{ backgroundImage: `url('${bg}')` }}
    >
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 bg-opacity-90 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-white">Login</h2>

        {errorMsg && (
          <p className="text-sm text-red-400 text-center">{errorMsg}</p>
        )}

        <form className="space-y-4" onSubmit={handler}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email Address
            </label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-4 py-2 mt-1 text-gray-900 bg-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              id="password"
              name="password"
              required
              className="w-full px-4 py-2 mt-1 text-gray-900 bg-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Login
          </button>
        </form>

        <p className="text-sm text-center text-gray-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
