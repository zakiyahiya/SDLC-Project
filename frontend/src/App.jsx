import { useState } from 'react';

function App() {
  const [issue, setIssue] = useState('');
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('javascript');

  const modes = [
    { id: 'debug', label: 'Debug', icon: '🔍', description: 'Find similar cases' },
    { id: 'test', label: 'Test', icon: '✓', description: 'Generate test cases' },
    { id: 'rootcause', label: 'Root Cause', icon: '🎯', description: 'Identify root cause' },
    { id: 'prevention', label: 'Prevention', icon: '🛡️', description: 'Prevention strategies' },
    { id: 'codegen', label: 'Code Gen', icon: '💻', description: 'Generate code' }
  ];

  const examples = [
    'Users unable to login after password reset',
    'API Gateway returns 504 timeout errors',
    'Payment transactions fail with duplicate error',
    'Database queries slow during peak hours'
  ];

  const codeExamples = [
    'Create a function to add two numbers',
    'Write a REST API endpoint for user authentication',
    'Build a React component for a todo list',
    'Create a Python function to sort an array'
  ];

  const languages = ['javascript', 'c++', 'python', 'java', 'typescript', 'go', 'rust', 'php', 'ruby'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!issue.trim() || !mode) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let response;
      
      if (mode === 'codegen') {
        // Use codegen endpoint
        response = await fetch('/codegen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: issue.trim(), language })
        });
      } else {
        // Use analyze endpoint
        response = await fetch('/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issue: issue.trim(), mode })
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setResult(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      const button = document.querySelector(`[data-copy="${type}"]`);
      if (button) {
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        button.style.backgroundColor = '#16a34a';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
        }, 2000);
      }
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const renderDebugResults = (results) => (
    <div className="results-grid">
      {results.map((item, idx) => (
        <div key={idx} className="result-card">
          <div className="card-header">
            <span className="case-id">{item.caseId}</span>
            <span className={`similarity-pill similarity-${item.similarity.toLowerCase()}`}>
              {item.similarity}
            </span>
          </div>
          <div className="card-body">
            <p className="match-reason">{item.matchReason}</p>
            <div className="suggested-fix">
              <strong>Suggested Fix:</strong>
              <p>{item.suggestedFix}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTestResults = (results) => (
    <div className="results-grid">
      {results.map((test, idx) => (
        <div key={idx} className="result-card">
          <div className="card-header">
            <span className="test-id">{test.testId}</span>
            <span className={`type-badge type-${test.type.toLowerCase().replace(/\s+/g, '-')}`}>
              {test.type}
            </span>
            <span className={`priority-badge priority-${test.priority.toLowerCase()}`}>
              {test.priority}
            </span>
          </div>
          <div className="card-body">
            <h4>{test.title}</h4>
            <div className="test-section">
              <strong>Preconditions:</strong>
              <p>{test.preconditions}</p>
            </div>
            <div className="test-section">
              <strong>Steps:</strong>
              <ol>
                {test.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
            <div className="test-section">
              <strong>Expected Result:</strong>
              <p>{test.expectedResult}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderRootCauseResults = (results) => (
    <div className="rootcause-container">
      <div className="result-card rootcause-card">
        <div className="card-header">
          <span className={`category-badge category-${results.causeCategory.toLowerCase().replace(/\s+/g, '-')}`}>
            {results.causeCategory}
          </span>
          <span className={`confidence-badge confidence-${results.confidence.toLowerCase()}`}>
            {results.confidence} Confidence
          </span>
        </div>
        <div className="card-body">
          <div className="rootcause-section">
            <h3>Primary Cause</h3>
            <p className="primary-cause">{results.primaryCause}</p>
          </div>
          <div className="rootcause-section">
            <h3>Evidence</h3>
            <p>{results.evidence}</p>
          </div>
          {results.relatedCaseIds && results.relatedCaseIds.length > 0 && (
            <div className="rootcause-section">
              <h3>Related Cases</h3>
              <div className="related-cases">
                {results.relatedCaseIds.map((caseId, idx) => (
                  <span key={idx} className="case-id">{caseId}</span>
                ))}
              </div>
            </div>
          )}
          <div className="action-boxes">
            <div className="action-box immediate">
              <h4>⚡ Immediate Action</h4>
              <p>{results.immediateAction}</p>
            </div>
            <div className="action-box permanent">
              <h4>🔧 Permanent Fix</h4>
              <p>{results.permanentFix}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreventionResults = (results) => (
    <div className="results-grid">
      {results.map((item, idx) => (
        <div key={idx} className="result-card">
          <div className="card-header">
            <span className={`category-badge category-${item.category.toLowerCase()}`}>
              {item.category}
            </span>
            <span className={`priority-badge priority-${item.priority.toLowerCase()}`}>
              {item.priority}
            </span>
            <span className={`effort-badge effort-${item.effort.toLowerCase()}`}>
              {item.effort} Effort
            </span>
          </div>
          <div className="card-body">
            <h4>{item.recommendation}</h4>
            <div className="prevention-section">
              <strong>Implementation:</strong>
              <p>{item.implementation}</p>
            </div>
            <div className="prevention-section">
              <strong>Success Metric:</strong>
              <p>{item.successMetric}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const formatCode = (code) => {
    // Format code by adding line breaks after common patterns
    return code
      .replace(/;\s*/g, ';\n')           // Line break after semicolons
      .replace(/\{\s*/g, '{\n')          // Line break after opening braces
      .replace(/\}\s*/g, '\n}\n')        // Line break before/after closing braces
      .replace(/import\s+/g, '\nimport ') // Line break before imports
      .split('\n')
      .filter(line => line.trim())       // Remove empty lines
      .map(line => line.trim())          // Trim each line
      .join('\n');
  };

  const renderCodeGenResults = (results) => {
    const formattedCode = formatCode(results.code);
    
    return (
      <div className="codegen-container">
        <div className="result-card codegen-card">
          <div className="card-header">
            <span className="language-badge">{results.language}</span>
          </div>
          <div className="card-body">
            <div className="codegen-section">
              <div className="section-header">
                <h3>Generated Code</h3>
                <button
                  className="copy-button"
                  data-copy="code"
                  onClick={() => copyToClipboard(formattedCode, 'code')}
                  title="Copy code to clipboard"
                >
                  📋 Copy Code
                </button>
              </div>
              <pre className="code-block">
                <code>{formattedCode}</code>
              </pre>
            </div>
            <div className="codegen-section">
              <h3>Explanation</h3>
              <p>{results.explanation}</p>
            </div>
            <div className="codegen-section">
              <div className="section-header">
                <h3>Usage</h3>
                <button
                  className="copy-button"
                  data-copy="usage"
                  onClick={() => copyToClipboard(results.usage, 'usage')}
                  title="Copy usage to clipboard"
                >
                  📋 Copy Usage
                </button>
              </div>
              <pre className="usage-block">
                <code>{results.usage}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!result) return null;

    const renderers = {
      debug: () => renderDebugResults(result.results),
      test: () => renderTestResults(result.results),
      rootcause: () => renderRootCauseResults(result.results),
      prevention: () => renderPreventionResults(result.results),
      codegen: () => renderCodeGenResults(result)
    };

    return (
      <div className="results-section">
        <h2>{mode === 'codegen' ? 'Generated Code' : 'Analysis Results'}</h2>
        {renderers[mode]?.() || <p>Unknown mode</p>}
      </div>
    );
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>SDLC Issue Analysis Assistant</h1>
          <p className="subtitle">AI-powered debugging and root cause analysis</p>
          <span className="bob-badge">Powered by Ollama</span>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          <form onSubmit={handleSubmit} className="analysis-form">
            <div className="mode-selector">
              <label>Select Analysis Mode:</label>
              <div className="mode-buttons">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`mode-button ${mode === m.id ? 'active' : ''}`}
                    onClick={() => setMode(m.id)}
                  >
                    <span className="mode-icon">{m.icon}</span>
                    <span className="mode-label">{m.label}</span>
                    <span className="mode-description">{m.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {mode === 'codegen' && (
              <div className="language-selector">
                <label htmlFor="language">Programming Language:</label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="language-select"
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="issue-input">
              <label htmlFor="issue">
                {mode === 'codegen' ? 'Describe the code you want to generate:' : 'Describe Your Issue:'}
              </label>
              <textarea
                id="issue"
                rows="4"
                placeholder={mode === 'codegen' ? 'E.g., Create a function to add two numbers' : 'Describe your issue...'}
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
              />
            </div>

            <div className="examples">
              <label>Quick Examples:</label>
              <div className="example-chips">
                {(mode === 'codegen' ? codeExamples : examples).map((ex, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="example-chip"
                    onClick={() => setIssue(ex)}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={!issue.trim() || !mode || loading}
            >
              {loading ? (mode === 'codegen' ? 'Generating...' : 'Analyzing...') : (mode === 'codegen' ? 'Generate Code' : 'Analyze Issue')}
            </button>
          </form>

          {error && (
            <div className="error-box">
              <strong>Error:</strong> {error}
            </div>
          )}

          {renderResults()}
        </div>
      </main>
    </div>
  );
}

export default App;

// Made with Bob
