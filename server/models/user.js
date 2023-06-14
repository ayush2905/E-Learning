import mongoose from "mongoose";
const { Schema } = mongoose;

const imageSchema = new Schema(
  {
  key: { 
    type: String, 
    required: true 
  },
  contentType: { 
    type: String, 
    required: true 
  },
  data: {
    type: Buffer,
    required: true
  }
});

const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
      max: 64,
    },
    picture: {
      type: String,
      default: "/avatar.png",
    },
    role: {
      type: [String],
      default: ["Subscriber"],
      enum: ["Subscriber", "Instructor", "Admin"],
    },
    images: [imageSchema],
    stripe_account_id: "",
    stripe_seller: {},
    stripeSession: {},
    passwordResetcode: {
      data: String,
      default: ""
    },
  },  
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
