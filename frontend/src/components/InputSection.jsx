
export default function InputSection({ url, setUrl, loading, onConvert }) {
  return (
    <section className="input-shell">
      <div className="input-row">
        <input
          className="url-input"
          type="text"
          placeholder="Paste a URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onConvert()}
        />
        <button
          className="convert-button"
          disabled={!url.trim() || loading}
          onClick={onConvert}
        >
          {loading ? 'Converting...' : 'Convert'}
        </button>
      </div>
    </section>
  );
}
