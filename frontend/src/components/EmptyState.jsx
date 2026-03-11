const EXAMPLE_URLS = [
  'https://github.com/torvalds/linux',
  'https://en.wikipedia.org/wiki/Markdown',
  'https://nextjs.org',
];

export default function EmptyState({ onPick }) {
  return (
    <div className="empty-shell">
      <p className="empty-label">Try these:</p>
      <div className="example-list">
        {EXAMPLE_URLS.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onPick(example)}
          >
            {example.replace(/^https?:\/\//, '')}
          </button>
        ))}
      </div>
    </div>
  );
}
