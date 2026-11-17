import mongoose from "mongoose";
import { ROLES } from "../libs/permissions.js";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Nome é obrigatório"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email é obrigatório"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: function () {
      return this.isNew;
    },
    minlength: 6,
  },
  role: {
    type: String,
    enum: ROLES,
    default: "funcionario",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
