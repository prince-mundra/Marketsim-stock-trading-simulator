import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stock', required: true },
  symbol: { type: String, required: true, uppercase: true },
  addedAt: { type: Date, default: Date.now },
}, { versionKey: false });

watchlistSchema.index({ userId: 1, stockId: 1 }, { unique: true });
watchlistSchema.index({ userId: 1, addedAt: -1 });
export default mongoose.model('Watchlist', watchlistSchema);
