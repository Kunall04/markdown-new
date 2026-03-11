import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import MetadataBar from './MetadataBar';
import { IconCopy, IconDownload } from './Icons';
import { resolveFilename } from '../utils/helpers';

export default function ResultView({ markdown, metadata, showFullMetadata }) {
  const [activeTab, setActiveTab] = useState('raw');
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = resolveFilename(metadata?.finalUrl || 'converted.md');
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <div className="result-shell">

      {/* Toolbar */}
      <div className="result-top">
        <div className="tabs">
          <button
            className={activeTab === 'raw' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('raw')}
          >
            Raw
          </button>
          <button
            className={activeTab === 'preview' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
        </div>
        <div className="result-tools">
          <button className="tool-btn" onClick={handleCopy}>
            <IconCopy />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button className="tool-btn" onClick={handleDownload}>
            <IconDownload />
            Download
          </button>
          <p className="counts">{markdown.length} chars</p>
        </div>
      </div>

      {/* Content */}
      <div className="result-body">
        {activeTab === 'raw' ? (
          <SyntaxHighlighter
            language="markdown"
            style={oneDark}
            showLineNumbers
            wrapLongLines
            customStyle={{ margin: 0, borderRadius: 0, background: 'transparent', padding: '1rem' }}
            lineNumberStyle={{ color: '#596878' }}
          >
            {markdown}
          </SyntaxHighlighter>
        ) : (
          <div className="preview-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdown}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Metadata bar */}
      <MetadataBar
        metadata={metadata}
        markdown={markdown}
        showFullMetadata={showFullMetadata}
      />

    </div>
  );
}
