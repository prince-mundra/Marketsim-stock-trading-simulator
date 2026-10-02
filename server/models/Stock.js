import mongoose from 'mongoose';

const pricePointSchema = new mongoose.Schema({
  time: { type: Date, required: true },
  price: { type: Number, required: true, min: 0 },
}, { _id: false });

const stockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true, uppercase: true, trim: true },
  companyName: { type: String, required: true, trim: true },
  currentPrice: { type: Number, required: true, min: 0 },
  previousClose: { type: Number, required: true, min: 0 },
  change: { type: Number, required: true, default: 0 },
  changePercent: { type: Number, required: true, default: 0 },
  exchange: { type: String, default: 'NSE (simulated)' },
  open: { type: Number, default: 0 },
  high: { type: Number, default: 0 },
  low: { type: Number, default: 0 },
  volume: { type: Number, default: 0 },
  priceHistory: { type: [pricePointSchema], default: [] },
  dataSource: { type: String, enum: ['SIMULATED'], default: 'SIMULATED' },
  updatedAt: { type: Date, default: Date.now },
}, { versionKey: false });

stockSchema.index({ companyName: 'text', symbol: 'text' });
export default mongoose.model('Stock', stockSchema);
