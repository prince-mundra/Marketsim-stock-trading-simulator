import { Bookmark, BookmarkCheck } from 'lucide-react';

export default function WatchlistButton({ active, onClick, disabled = false, label }) {
  const Icon = active ? BookmarkCheck : Bookmark;
  return (
    <button
      type="button"
      className={`icon-button ${active ? 'icon-button--active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label || (active ? 'Remove from watchlist' : 'Add to watchlist')}
      title={label || (active ? 'Remove from watchlist' : 'Add to watchlist')}
    ><Icon size={17} /></button>
  );
}
