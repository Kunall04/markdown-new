export default function Header() {
  return (
    <header className="top-bar">
      <div className="identity">
        <p className="project-name">url-to-markdown</p>
        <p className="tagline">Clean markdown from any URL.</p>
      </div>
      <div className="top-links">
        <a href="/api/convert?url=https://example.com" target="_blank" rel="noreferrer">
          API
        </a>
        <a href="https://github.com/Kunall04/markdown-new" target="_blank" rel="noreferrer">
          Docs
        </a>
      </div>
    </header>
  );
}
