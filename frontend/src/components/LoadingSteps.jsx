const STEPS = [
  'Fetching URL...',
  'Detecting page type...',
  'Converting to markdown...',
];

export default function LoadingSteps({ activeStep, completedSteps }) {
  return (
    <div className="loading-shell">
      <h2>Running pipeline</h2>
      <ul className="step-list">
        {STEPS.map((step, index) => {
          const isDone = index < completedSteps;
          const isActive = !isDone && index === activeStep;
          return (
            <li
              key={step}
              className={`step-row ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
            >
              <span className="step-marker">
                {isDone ? '[x]' : isActive ? '[>]' : '[ ]'}
              </span>
              <span>{step}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export const STEP_COUNT = STEPS.length;
