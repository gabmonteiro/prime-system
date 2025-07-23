// src/services/userService.js
import connectDB from '../libs/db.js';
import User from '../models/user.js';
import bcrypt from 'bcryptjs';

export class UserService {
  static async createUser(userData) {
    await connectDB();
    
    const { name, email, password } = userData;
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });
    
    // Retornar sem a senha
    const { password: _, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  static async getUserByEmail(email) {
    await connectDB();
    return await User.findOne({ email }).select('-password');
  }

  static async getAllUsers() {
    await connectDB();
    return await User.find({}).select('-password');
  }

  static async updateUser(id, updateData) {
    await connectDB();
    
    const user = await User.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');
    
    return user;
  }

  static async deleteUser(id) {
    await connectDB();
    return await User.findByIdAndDelete(id);
  }
}