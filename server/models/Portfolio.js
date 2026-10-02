import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stock', required: true },
  symbol: { type: String, required: true, uppercase: true },
  quantity: { type: Number, required: true, min: 0 },
  averageBuyPrice: { type: Number, required: true, min: 0 },
  investedAmount: { type: Number, required: true, min: 0 },
  updatedAt: { type: Date, default: Date.now },
}, { versionKey: false });

portfolioSchema.index({ userId: 1, stockId: 1 }, { unique: true });
portfolioSchema.index({ userId: 1, symbol: 1 });
export default mongoose.model('Portfolio', portfolioSchema);
