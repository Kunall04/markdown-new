import { useState, useMemo } from 'react';
import { formatNumber } from '../utils/helpers';

export default function MetadataBar({ metadata, markdown, showFullMetadata = true }) {
  const [expanded, setExpanded] = useState(false);

  const summary = useMemo(() => {
    if (!metadata) return '';

    if (showFullMetadata) {
      const code = Number(metadata.status);
      const statusLabel = Number.isFinite(code)
        ? `${code} ${code >= 200 && code < 300 ? 'OK' : 'ERR'}`
        : 'n/a';

      const typeLabel = metadata.reason
        ? `${metadata.pageType} (${metadata.reason})`
        : metadata.pageType || 'UNKNOWN';

      const chars = `${formatNumber(metadata.markdownLength || markdown.length)} chars`;

      const timing = metadata.timings?.totalMs
        ? `${formatNumber(metadata.timings.totalMs)}ms`
        : 'timing n/a';

      const cache = metadata.cache?.hit ? 'cached: hit' : 'cached: miss';

      return `${statusLabel}  |  ${typeLabel}  |  ${chars}  |  ${timing}  |  ${cache}`;
    } else {

      const chars = `${formatNumber(metadata.markdownLength || markdown.length)} chars`;
      const timing = metadata.timings?.totalMs
        ? `${formatNumber(metadata.timings.totalMs)}ms`
        : 'timing n/a';
      return `${chars}  |  ${timing}`;
    }
  }, [metadata, markdown.length, showFullMetadata]);

  if (!metadata) return null;

  return (
    <div className="meta-shell">
      {showFullMetadata ? (

        <>
          <button
            type="button"
            className="meta-bar"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            <span>{summary}</span>
            <span>{expanded ? 'Hide JSON' : 'Show JSON'}</span>
          </button>

          {expanded && (
            <pre className="meta-json">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          )}
        </>
      ) : (

        <div className="meta-bar" style={{ cursor: 'default' }}>
          <span>{summary}</span>
        </div>
      )}
    </div>
  );
}
