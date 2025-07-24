import connectDB from "../libs/db.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs";

export default class LoginService {
  static async authenticate(email, password) {
    await connectDB();
    const user = await User.findOne({ email });
    if (!user) return null;
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;
    // Retorna o usuário sem a senha
    const { password: _, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }
}
