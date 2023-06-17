import expressJwt from "express-jwt";
import User from '../models/user';

export const requireSignin = expressJwt({
  getToken: (req, res) => req.cookies.token,
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

export const isInstructor = async(req, res, next) => {
  try {
    const user = await User.findById(req.user._id).exec();   //get user from requireSignIn middleware and hence will include it as middleware in its route
    if(!user.role.includes('Instructor')) {
      return res.status(403)
    } else {
      next();
    }
  } catch(err) {
    console.log(err);
  }
}
