import express from "express";

const router = express.Router();

// middleware
import { requireSignin } from "../middlewares";

// controllers
import { uploadImage } from "../controllers/course";

router.post("/course/upload-image",requireSignin, uploadImage);

module.exports = router;
