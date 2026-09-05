import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { Role } from '../common/enums/role.enum.js';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(data: {
    email: string;
    password: string;
    name: string;
    role?: Role;
  }): Promise<UserDocument> {
    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.userModel.create({
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role ?? Role.Customer,
    });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-passwordHash -refreshTokenHash');
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, dto, { new: true })
      .select('-passwordHash -refreshTokenHash');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setRefreshToken(userId: string, token: string | null): Promise<void> {
    const refreshTokenHash = token ? await bcrypt.hash(token, 10) : '';
    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash });
  }

  async validateRefreshToken(
    userId: string,
    token: string,
  ): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    if (!user?.refreshTokenHash) return false;
    return bcrypt.compare(token, user.refreshTokenHash);
  }

  sanitize(user: UserDocument) {
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
