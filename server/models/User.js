import mongoose from 'mongoose';
import { STARTING_VIRTUAL_BALANCE } from '../utils/financial.js';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  virtualBalance: { type: Number, required: true, default: STARTING_VIRTUAL_BALANCE, min: 0 },
}, { timestamps: true, versionKey: false });

export default mongoose.model('User', userSchema);
