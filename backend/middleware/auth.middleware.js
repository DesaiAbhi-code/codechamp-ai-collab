// import jwt from "jsonwebtoken";
// import redisClient from "../services/redis.service.js";
// export const authUser = async (req, res, next) => {
//   try {
//     // Get the token from cookies, headers, or query parameters
//     const token =
//       req.cookies.token ||
//       (req.headers.authorization && req.headers.authorization.split(" ")[1]);

//     // Check if the token exists
//     if (!token) {
//       return res.status(401).send({ error: "Unauthorized User" });
//     }


//     const isBlackListed = await redisClient.get(token);

    

//     if (isBlackListed) {
//         res.cookie('token', '');

//         return res.status(401).send({ error: 'Unauthorized User' });
//     }

//     // Verify the token
//     const decoded = jwt.verify(token, process.env.JWT_KEY);
//     req.user = decoded;

//     // Call the next middleware
//     next();
    
//   } catch (error) {
//     console.error(error);
//     res.status(401).send({ error: "Unauthorized User" });
//   }
// };
import jwt from "jsonwebtoken";

export const authUser = async (req, res, next) => {
  try {
    const token =
      req.cookies.token ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).send({ error: "Unauthorized User" });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.user = decoded;

    next();
  } catch (error) {
    console.error(error);
    res.status(401).send({ error: "Unauthorized User" });
  }
};
