import { AlertCircle, Search } from 'lucide-react';

export default function StateBlock({ title, description, kind = 'empty', action }) {
  const Icon = kind === 'error' ? AlertCircle : Search;
  return (
    <section className={`state-block state-block--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <span className="state-block__icon"><Icon size={20} /></span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </section>
  );
}
