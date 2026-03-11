import { useState, useEffect } from 'react';

import Header from './components/Header';
import InputSection from './components/InputSection';
import LoadingSteps from './components/LoadingSteps';
import EmptyState from './components/EmptyState';
import ResultView from './components/ResultView';


const SHOW_FULL_METADATA = false;

export default function App() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Conversion failed.');
      }

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