import AWS from "aws-sdk";
import User from "../models/user";
import Course from "../models/course";
import { nanoid } from "nanoid";
import Completed from "../models/completed";
import slugify from "slugify";
import { readFileSync } from "fs";
const stripe = require("stripe")(process.env.STRIPE_SECRET);

const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
};

const S3 = new AWS.S3(awsConfig);

export const uploadImage = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).send("No image");
    //get rid of additional data in image
    const base64Data = new Buffer.from(
      image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    const type = image.split(";")[0].split("/")[1]; //to get the image format jpeg or png we split the stringtwice (jpeg word lies bw ; & /)

    //image params
    //ACL: access control lists
    const params = {
      Bucket: "ayush2905-elearning",
      Key: `${nanoid()}.${type}`,
      Body: base64Data,
      ACL: "public-read",
      ContentEncoding: "base64",
      ContentType: `image/${type}`,
    };

    //upload to S3
    S3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        return res.sendStatus(400);
      }
      console.log(data);
      res.send(data);
    });
    //console.log(base64Data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload image" });
  }
};

export const removeImage = (req, res) => {
  try {
    const { image } = req.body;
    const params = {
      Bucket: image.Bucket,
      Key: image.Key,
    };

    //send remove request to S3
    S3.deleteObject(params, (err, data) => {
      if (err) {
        console.log(err);
        res.sendStatus(400);
      }
      res.send({ ok: true });
    });
  } catch (err) {
    console.log(err);
  }
};

//React course for beginners
//react-course-for-beginners
//^^this is how slugify works we are applying on course name
export const create = async (req, res) => {
  // console.log("Create Course", req.body);
  // return;
  try {
    const alreadyExist = await Course.findOne({
      slug: slugify(req.body.name.toLowerCase()),
    });
    if (alreadyExist) return res.status(400).send("Title is taken");

    const course = await new Course({
      slug: slugify(req.body.name),
      instructor: req.user._id,
      ...req.body,
    }).save();

    res.json(course);
  } catch (err) {
    console.log(err);
    return res.status(400).send("Course create failed. Try Again");
  }
};

export const read = async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug })
      .populate("instructor", "_id name")
      .exec();
    res.json(course);
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export const uploadVideo = async (req, res) => {
  try {
    if (req.user._id != req.params.instructorId) {
      return res.status(400).send("Unauthorized");
    }
    const { video } = req.files;
    if (!video) return res.status(400).send("No Video!");

    //video params
    const params = {
      Bucket: "ayush2905-elearning",
      Key: `${nanoid()}.${video.type.split("/")[1]}`,
      Body: readFileSync(video.path),
      ACL: "public-read",
      ContentType: video.type,
    };

    S3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        res.sendStatus(400);
      }
      console.log(data);
      res.send(data);
    });
  } catch (err) {
    console.log(err);
  }
};

export const removeVideo = async (req, res) => {
  try {
    const { Bucket, Key } = req.body;
    //if (!video) return res.status(400).send("No Video!");

    //video params
    const params = {
      Bucket,
      Key,
    };

    S3.deleteObject(params, (err, data) => {
      if (err) {
        console.log(err);
        res.sendStatus(400);
      }
      console.log(data);
      res.send({ ok: true });
    });
  } catch (err) {
    console.log(err);
  }
};

export const addLesson = async (req, res) => {
  try {
    const { slug, instructorId } = req.params;
    const { title, content, video } = req.body;
    if (req.user._id != instructorId) {
      return res.status(400).send("Unauthorized");
    }

    const updated = await Course.findOneAndUpdate(
      { slug },
      {
        $push: { lessons: { title, content, video, slug: slugify(title) } },
      },
      { new: true } //to include added lesson also
    )
      .populate("instructor", "_id name")
      .exec();
    res.json(updated);
  } catch (err) {
    console.log(err);
    return res.status(400).send("Add Lesson failed");
  }
};

export const publishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).select("instructor").exec();
    if (req.user._id != course.instructor._id) {
      return res.status(400).send("Unauthorized");
    }
    const updated = await Course.findByIdAndUpdate(
      courseId,
      {
        published: true,
      },
      { new: true }
    ).exec();
    res.json(updated);
  } catch (err) {
    console.log(err);
    return res.status(400).send("Publish course failed");
  }
};

export const unpublishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).select("instructor").exec();
    if (req.user._id != course.instructor._id) {
      return res.status(400).send("Unauthorized");
    }
    const updated = await Course.findByIdAndUpdate(
      courseId,
      {
        published: false,
      },
      { new: true }
    ).exec();
    res.json(updated);
  } catch (err) {
    console.log(err);
    return res.status(400).send("Unpublish course failed");
  }
};

export const courses = async (req, res) => {
  const all = await Course.find({ published: true })
    .populate("instructor", "_id name")
    .exec();
  res.json(all);
};

export const checkEnrollment = async (req, res) => {
  const { courseId } = req.params;
  //find courses of currently loggedin user
  const user = await User.findById(req.user._id).exec();
  // console.log(user);
  // check if courseid is present in user courses array
  let ids = [];
  let length = user.courses && user.courses.length;
  for (let i = 0; i < length; i++) {
    ids.push(user.courses[i].toString());
  }
  res.json({
    status: ids.includes(courseId),
    course: await Course.findById(courseId).exec(),
  });
};

export const freeEnrollment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).exec();
    if (course.paid) return;
    const result = await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: { courses: course._id },
      },
      { new: true }
    ).exec();
    res.json({
      message: "Congratulations! You have successfully enrolled",
      course,
    });
  } catch (err) {
    console.log("Free enrollment error");
    return res.status(400).send("Enrollment create failed");
  }
};

export const paidEnrollment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate("instructor")
      .exec();
    if (!course.paid) return;
    //application fee 30%
    const fee = (course.price * 30) / 100;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      // purchase details
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(course.price.toFixed(2) * 100),
            product_data: {
              name: course.name,
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      //charge buyer aand transfer remaining balance to seller after fee
      payment_intent_data: {
        application_fee_amount: Math.round(fee.toFixed(2) * 100),
        transfer_data: {
          destination: course.instructor.stripe_account_id,
        },
      },
      //redirect url after successful payment
      success_url: `${process.env.STRIPE_SUCCESS_URL}/${course._id}`,
      cancel_url: process.env.STRIPE_CANCEL_URL,
    });
    console.log("SESSION ID => ", session);
    //saving because in case the user pays but on redirecting some proble occurs
    await User.findByIdAndUpdate(req.user._id, {
      stripeSession: session,
    }).exec();
    res.end(session.id);
  } catch (err) {
    console.log("Paid enrollment error ", err);
    return res.status(400).send("Enrollment create failed");
  }
};

export const stripeSuccess = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).exec();
    //get stripe session id and update unpaid to paid
    const user = await User.findById(req.user._id).exec();
    if (!user.stripeSession.id) return res.sendStatus(400);
    //retrieve stripe session
    const session = await stripe.checkout.sessions.retrieve(
      user.stripeSession.id
    );
    console.log("stripe success => ", session);
    if (session.payment_status === "paid") {
      await User.findByIdAndUpdate(user._id, {
        $addToSet: { course: course._id },
        $set: { stripeSession: {} },
      }).exec();
    }
    res.json({ success: true, course });
  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
};

export const userCourses = async (req, res) => {
  const user = await User.findById(req.user._id).exec();
  const courses = await Course.find({ _id: { $in: user.courses } })
    .populate("instructor", "_id name")
    .exec();
  res.json(courses);
};

export const markCompleted = async (req, res) => {
  try {
    const { courseId, lessonId } = req.body;
    const existing = await Completed.findOne({
      user: req.user._id,
      course: courseId,
    }).exec();

    if (existing) {
      const updated = await Completed.findOneAndUpdate({
        user: req.user._id,
      });
    } else {
    }
  } catch (err) {
    console.log(err);
  }
};

export const studentCount = async (req, res) => {
  try {
    const users = await User.find({ courses: req.body.courseId })
      .select("_id")
      .exec();
    res.json(users);
  } catch (err) {
    console.log(err);
  }
};

export const instructorBalance = async (req, res) => {
  try {
    let user = await User.findById(req.user._id).exec();
    const balance = await stripe.balance.retrieve({
      stripeAccount: user.stripe_account_id,
    });
    res.json(balance);
  } catch (err) {
    console.log(err);
  }
};

export const instructorPayoutSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).exec();
    console.log(user);
    const loginLink = await stripe.accounts.createLoginLink(
      user.stripe_seller.id,
      { redirect_url: process.env.STRIPE_SETTINGS_REDIRECT }
    );
    res.json(loginLink.url);
  } catch (err) {
    console.log("stripe payout settings login link err =>", err);
  }
};
