// import React, { useState, useContext } from "react";
// import { Link, useNavigate } from "react-router-dom"; // Import Link from react-router-dom
// import axios from "../config/Axios";
// import { UserContext } from "../Context/User.context";

// const Register = () => {

//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
// const [errorMessage, setErrorMessage] = useState('');


//   const navigate = useNavigate()

//   const { setUser } = useContext(UserContext);

//   function submitHandler(e) {

//     e.preventDefault()

//     axios.post('/user/register', {
//       email,
//       password
//     }).then((res) => {
//       localStorage.setItem('token', res.data.token),
//         setUser(res.data.user)
//       // console.log(res.data)
//       navigate('/login')
//     }).catch((err) => {
//       // console.log(err.response.data)
//     })
//   }



//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-900">
//       <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
//         <h2 className="text-3xl font-bold text-center text-white">Create an Account</h2>
//         <form onSubmit={submitHandler} className="space-y-4">
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
//           <div>
//             <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
//               Confirm Password
//             </label>
//             <input
//               type="password"
//               id="confirmPassword"
//               name="confirmPassword"
//               required
//               className="w-full px-4 py-2 mt-1 text-gray-900 bg-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
//               placeholder="Confirm your password"
//             />
//           </div>
//           <button
//             type="submit"
//             className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
//           >
//             Register
//           </button>
//         </form>
//         <p className="text-sm text-center text-gray-400">
//           Already have an account?{" "}
//           <Link to="/login" className="text-blue-500 hover:underline">
//             Login
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Register;
import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../config/Axios";
import { UserContext } from "../Context/User.context";
import bg from "../assets/images/AI_Enabled_Chatbot_for_Customer_Management_Benefits_and_Integration_Process_82e6ccb319.webp";

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  function submitHandler(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    axios.post('/user/register', { email, password })
      .then((res) => {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        navigate('/login');
      })
      .catch((err) => {
        if (err.response && err.response.data && err.response.data.message) {
          setErrorMessage(err.response.data.message);
        } else {
          setErrorMessage("Something went wrong. Please try again.");
        }
      });
  }

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center flex items-center justify-center relative px-4"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Dark overlay same as login */}
      {/* <div className="absolute inset-0 bg-black bg-opacity-60"></div> */}

      {/* Registration Form Box */}
     <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 bg-opacity-90 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-white">Create an Account</h2>

        {errorMessage && (
          <div className="p-3 text-sm text-red-400 bg-red-100 rounded-md">
            {errorMessage}
          </div>
        )}

        <form onSubmit={submitHandler} className="space-y-4">
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

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
              Confirm Password
            </label>
            <input
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              className="w-full px-4 py-2 mt-1 text-gray-900 bg-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Register
          </button>
        </form>

        <p className="text-sm text-center text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
