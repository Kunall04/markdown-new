import { useState, useEffect } from 'react';

import Header from './components/Header';
import InputSection from './components/InputSection';
import LoadingSteps from './components/LoadingSteps';
import EmptyState from './components/EmptyState';
import ResultView from './components/ResultView';
import { convertUrl } from './api/convert';


const SHOW_FULL_METADATA = false;
const DEFAULT_OPTIONS = {
  frontmatter: false,
  images: true,
  links: false,
  selectorEnabled: false,
  selector: '',
};

export default function App() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);

  useEffect(() => {
    if (!loading) return;
    setActiveStep(0);
    setCompletedSteps(0);

    const timer = setInterval(() => {
      setActiveStep((current) => {
        if (current >= 2) return current; //3 stp
        setCompletedSteps(current + 1);
        return current + 1;
      });
    }, 500);

    return () => clearInterval(timer);
  }, [loading]);

  async function handleConvert(inputUrl) {
    const targetUrl = (inputUrl || url).trim();
    if (!targetUrl || loading) return;

    setUrl(targetUrl);
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const data = await convertUrl(targetUrl, {
        frontmatter: options.frontmatter,
        images: options.images,
        links: options.links,
        selector: options.selectorEnabled ? options.selector.trim() : null,
      });

      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setCompletedSteps(3);
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <Header />

      <main className="workspace">
        <InputSection
          url={url}
          setUrl={setUrl}
          options={options}
          setOptions={setOptions}
          loading={loading}
          onConvert={() => handleConvert()}
        />

        <section className={result || loading || error ? 'output-shell visible' : 'output-shell'}>
          {loading && (
            <LoadingSteps activeStep={activeStep} completedSteps={completedSteps} />
          )}

          {!loading && error && (
            <p className="error-text">{error}</p>
          )}

          {!loading && !error && !result && (
            <EmptyState onPick={handleConvert} />
          )}

          {!loading && !error && result && (
            <ResultView
              markdown={result.markdown || ''}
              metadata={result.metadata || null}
              showFullMetadata={SHOW_FULL_METADATA}
            />
          )}
        </section>
      </main>
    </div>
  );
}
