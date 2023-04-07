import User from "../models/user";
import { hashPassword, comparePassword } from "../utils/auth";
import jwt from "jsonwebtoken";
import nodemailer from 'nodemailer';
import { nanoid } from 'nanoid'

export const register = async (req, res) => {
  try {
    // console.log(req.body);
    const { name, email, password } = req.body;
    // validation
    if (!name) return res.status(400).send("Name is required");
    if (!password || password.length < 6) {
      return res
        .status(400)
        .send("Password is required and should be min 6 characters long");
    }
    let userExist = await User.findOne({ email }).exec();
    if (userExist) return res.status(400).send("Email is taken");

    // hash password
    const hashedPassword = await hashPassword(password);

    // register
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });
    await user.save();
    // console.log("saved user", user);
    return res.json({ ok: true });
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error. Try again.");
  }
};

export const login = async (req, res) => {
  try {
    // console.log(req.body);
    const { email, password } = req.body;
    // check if our db has user with that email
    const user = await User.findOne({ email }).exec();
    if (!user) return res.status(400).send("No user found");
    // check password
    const match = await comparePassword(password, user.password);
    if(!match) return res.status(400).send("Wrong Password");
    // create signed jwt
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    // return user and token to client, exclude hashed password
    user.password = undefined;
    // send token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      // secure: true, // only works on https
    });
    // send user as json response
    res.json(user);
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error. Try again.");
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.json({ message: "Signout success" });
  } catch (err) {
    console.log(err);
  }
};

export const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password").exec();
    console.log("CURRENT_USER", user);
    return res.json({ ok: true });
  } catch (err) {
    console.log(err);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const {email} = req.body;
    // console.log(email);
    const shortCode = nanoid(6);
    const user = await User.findOneAndUpdate({email}, {passwordResetcode: shortCode});
    if(!user) {
      return res.status(400).send("User not found");
    }

    //prepare for email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      secure: false,
      auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_PASSWORD,
      },
    });
    const mailOptions = {
      from: 'ayushagrawal0529@gmail.com',
      to: email,
      subject: 'Password Reset',
      html: `<html>
        <h1>Reset Password</h1>
        <p>Use this code to reset your password</p>
        <h2 style="color:red;">${shortCode}<h2/>
        <i>edemy.com</i>
      </html>`,
    };
    const emailSent = transporter.sendMail(mailOptions);
    emailSent.then(info => {
      console.log("Email sent successfully");
      console.log(info);
    })
    .catch(error => {
      console.log("Error sending email:");
      console.log(error);})
  } catch(err) {
    console.log(err);
  }
};

export const resetPassword = async(req ,res) => {
  try {
    const {email, code, newPassword} = req.body;
    const hashedPassword = await hashPassword(newPassword)
    const user = User.findOneAndUpdate({
      email, passwordResetcode: code
    }, {
      password: hashedPassword,
      passwordResetcode: ''
    }).exec();
    if(user===null)console.log("nahi mila")
    res.json( {ok: true} )
} catch(err) {
  console.log(err);
  return res.status(400).send("Error! Try again!")
}
}

export const sendTestEmail = async (req, res) => {
  // const [email, setEmail] = useState('');
  // const [message, setMessage] = useState('');

  // const handleEmailChange = (event) => {
  //   setEmail(event.target.value);
  // };

  // const handleSubmit = async (event) => {
  //   event.preventDefault();
  //   try {
  //     const response = await axios.post('/api/reset-password', { email });
  //     const transporter = nodemailer.createTransport({
  //       service: 'gmail',
  //       auth: {
  //         user: process.env.GMAIL_USERNAME,
  //         pass: process.env.GMAIL_PASSWORD,
  //       },
  //     });
  //     const mailOptions = {
  //       from: 'your-email@example.com',
  //       to: email,
  //       subject: 'Password Reset',
  //       html: `Click <a href="${response.data.resetUrl}">here</a> to reset your password.`,
  //     };
  //     transporter.sendMail(mailOptions, (error) => {
  //       if (error) {
  //         console.log(error);
  //         setMessage('An error occurred while sending the email.');
  //       } else {
  //         console.log('Email sent successfully');
  //         setMessage('An email has been sent with instructions to reset your password.');
  //       }
  //     });
  //   } catch (error) {
  //     console.log(error);
  //     setMessage('An error occurred while resetting your password.');
  //   }
  // };

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: false,
    auth: {
      user: process.env.GMAIL_USERNAME,
      pass: process.env.GMAIL_PASSWORD,
    },
  });
  const mailOptions = {
    from: 'ayushagrawal0529@gmail.com',
    to: 'ayushagrawal2905@gmail.com',
    subject: 'Password Reset',
    html: `Click here to reset your password.`,
  };
  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      console.log(error);
      //setMessage('An error occurred while sending the email.');
    } else {
      console.log('Email sent successfully');
      //setMessage('An email has been sent with instructions to reset your password.');
    }
  });

  // return (
  //   <div>
  //     <h2>Forgot Password</h2>
  //     <form onSubmit={handleSubmit}>
  //       <label>
  //         Email:
  //         <input type="email" value={email} onChange={handleEmailChange} />
  //       </label>
  //       <button type="submit">Reset Password</button>
  //     </form>
  //     {message && <p>{message}</p>}
  //   </div>
  // );
};
