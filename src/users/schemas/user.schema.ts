import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../common/enums/role.enum.js';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: String, enum: Role, default: Role.Customer })
  role!: Role;

  @Prop({ default: '' })
  refreshTokenHash!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
