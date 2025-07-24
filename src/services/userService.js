// src/services/userService.js
import connectDB from "../libs/db.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs";

export class UserService {
  static async getAllUsers() {
    await connectDB();
    return await User.find({}).select("-password");
  }

  static async getUserById(id) {
    await connectDB();
    return await User.findById(id).select("-password");
  }

  static async createUser(userData) {
    await connectDB();

    const { name, email, password, isAdmin = false } = userData;

    // Verificar se usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Usuário com este email já existe");
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isAdmin,
    });

    // Retornar sem a senha
    const { password: _, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  static async updateUser(id, userData) {
    await connectDB();

    const { name, email, password, isAdmin } = userData;

    // Verificar se email já existe em outro usuário
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: id },
      });
      if (existingUser) {
        throw new Error("Usuário com este email já existe");
      }
    }

    const updateData = { name, email, isAdmin };

    // Só atualizar senha se foi fornecida
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    return user;
  }

  static async deleteUser(id) {
    await connectDB();

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    return { message: "Usuário excluído com sucesso" };
  }

  static async getUserByEmail(email) {
    await connectDB();
    return await User.findOne({ email }).select("-password");
  }

  static async getAllUsers() {
    await connectDB();
    return await User.find({}).select("-password");
  }

  static async updateUser(id, updateData) {
    await connectDB();

    const user = await User.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).select("-password");

    return user;
  }

  static async deleteUser(id) {
    await connectDB();
    return await User.findByIdAndDelete(id);
  }
}
