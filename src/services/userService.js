// src/services/userService.js
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import { getUserPermissions, getFormattedPermissions } from "./permissionService.js";

export class UserService {
  static async getAllUsers() {
    try {
      const users = await User.find({}, { password: 0 }).sort({ name: 1 });
      
      // Adicionar permissões formatadas para cada usuário
      const usersWithPermissions = users.map(user => {
        const userObj = user.toObject();
        userObj.permissions = getFormattedPermissions(userObj);
        userObj.permissionsList = getUserPermissions(userObj);
        return userObj;
      });
      
      return usersWithPermissions;
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      throw new Error("Erro ao buscar usuários");
    }
  }

  static async getUserById(id) {
    try {
      const user = await User.findById(id, { password: 0 });
      if (!user) {
        throw new Error("Usuário não encontrado");
      }
      
      // Adicionar permissões formatadas
      const userObj = user.toObject();
      userObj.permissions = getFormattedPermissions(userObj);
      userObj.permissionsList = getUserPermissions(userObj);
      
      return userObj;
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      throw error;
    }
  }

  static async getUserByEmail(email) {
    try {
      const user = await User.findOne({ email });
      return user;
    } catch (error) {
      console.error("Erro ao buscar usuário por email:", error);
      throw error;
    }
  }

  static async createUser(userData) {
    try {
      // Verificar se o email já existe
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error("Email já está em uso");
      }

      // Hash da senha
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Criar usuário
      const newUser = new User({
        ...userData,
        password: hashedPassword,
      });

      const savedUser = await newUser.save();
      
      // Retornar usuário sem senha
      const userObj = savedUser.toObject();
      delete userObj.password;
      
      // Adicionar permissões formatadas
      userObj.permissions = getFormattedPermissions(userObj);
      userObj.permissionsList = getUserPermissions(userObj);
      
      return userObj;
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      throw error;
    }
  }

  static async updateUser(id, userData) {
    try {
      // Se a senha estiver sendo atualizada, fazer hash
      if (userData.password) {
        const saltRounds = 10;
        userData.password = await bcrypt.hash(userData.password, saltRounds);
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { ...userData, updatedAt: Date.now() },
        { new: true, runValidators: true }
      ).select({ password: 0 });

      if (!updatedUser) {
        throw new Error("Usuário não encontrado");
      }

      // Adicionar permissões formatadas
      const userObj = updatedUser.toObject();
      userObj.permissions = getFormattedPermissions(userObj);
      userObj.permissionsList = getUserPermissions(userObj);
      
      return userObj;
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      throw error;
    }
  }

  static async deleteUser(id) {
    try {
      const deletedUser = await User.findByIdAndDelete(id);
      if (!deletedUser) {
        throw new Error("Usuário não encontrado");
      }
      return { success: true, message: "Usuário excluído com sucesso" };
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      throw error;
    }
  }

  static async changePassword(id, currentPassword, newPassword) {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error("Usuário não encontrado");
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error("Senha atual incorreta");
      }

      // Hash da nova senha
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Atualizar senha
      user.password = hashedNewPassword;
      user.updatedAt = Date.now();
      await user.save();

      return { success: true, message: "Senha alterada com sucesso" };
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      throw error;
    }
  }

  static async validateCredentials(email, password) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return { isValid: false, user: null };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { isValid: false, user: null };
      }

      // Retornar usuário sem senha
      const userObj = user.toObject();
      delete userObj.password;
      
      // Adicionar permissões formatadas
      userObj.permissions = getFormattedPermissions(userObj);
      userObj.permissionsList = getUserPermissions(userObj);
      
      return { isValid: true, user: userObj };
    } catch (error) {
      console.error("Erro ao validar credenciais:", error);
      throw error;
    }
  }

  static async getUserPermissions(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("Usuário não encontrado");
      }
      
      return {
        permissions: getFormattedPermissions(user),
        permissionsList: getUserPermissions(user)
      };
    } catch (error) {
      console.error("Erro ao buscar permissões do usuário:", error);
      throw error;
    }
  }
}
