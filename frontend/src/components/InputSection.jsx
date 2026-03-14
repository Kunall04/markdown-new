const FLAG_OPTIONS = [
  { key: 'frontmatter', label: 'Frontmatter' },
  { key: 'images', label: 'Images' },
  { key: 'links', label: 'Links Summary' },
];

export default function InputSection({ url, setUrl, options, setOptions, loading, onConvert }) {
  function handleSubmit(event) {
    event.preventDefault();
    onConvert();
  }

  function toggleFlag(key) {
    setOptions((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function toggleSelector() {
    setOptions((current) => ({
      ...current,
      selectorEnabled: !current.selectorEnabled,
    }));
  }

  return (
    <section className="input-shell">
      <form className="convert-form" onSubmit={handleSubmit}>
        <div className="input-row">
          <input
            className="url-input"
            type="text"
            placeholder="Paste a URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            className="convert-button"
            type="submit"
            disabled={!url.trim() || loading}
          >
            {loading ? 'Converting...' : 'Convert'}
          </button>
        </div>

        <div className="flag-row">
          {FLAG_OPTIONS.map((flag) => (
            <button
              key={flag.key}
              type="button"
              className={options[flag.key] ? 'flag active' : 'flag'}
              aria-pressed={options[flag.key]}
              disabled={loading}
              onClick={() => toggleFlag(flag.key)}
            >
              {flag.label}
            </button>
          ))}

          <button
            type="button"
            className={options.selectorEnabled ? 'flag active' : 'flag'}
            aria-pressed={options.selectorEnabled}
            disabled={loading}
            onClick={toggleSelector}
          >
            CSS Selector
          </button>
        </div>

        {options.selectorEnabled && (
          <input
            className="selector-input"
            type="text"
            placeholder="article, main, .content"
            value={options.selector}
            onChange={(e) => setOptions((current) => ({
              ...current,
              selector: e.target.value,
            }))}
          />
        )}
      </form>
    </section>
  );
}
