import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Environment validation
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://9.60.223.58:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'codellama';
const PORT = process.env.PORT || 3001;

console.log(`Using Ollama API at: ${OLLAMA_API_URL}`);
console.log(`Using model: ${OLLAMA_MODEL}`);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Load cases at startup
let cases = [];
try {
  const casesPath = path.join(__dirname, 'cases.json');
  const casesData = fs.readFileSync(casesPath, 'utf-8');
  cases = JSON.parse(casesData);
  console.log(`Cases loaded: ${cases.length}`);
} catch (error) {
  console.error('ERROR: Failed to load cases.json:', error.message);
  process.exit(1);
}

// Build prompt based on mode
function buildPrompt(issue, mode, cases) {
  const casesList = cases.map((c, idx) => 
    `${idx + 1}. [${c.id}] ${c.module}\n   Symptom: ${c.symptom}\n   Root Cause: ${c.rootCause}\n   Fix: ${c.fix}`
  ).join('\n\n');

  const modeInstructions = {
    debug: `Role: Senior software debugger.
Task: Find the 3 most similar historical cases to the issue below.
Output schema:
{
  "mode": "debug",
  "issue": "<original issue>",
  "results": [
    {
      "caseId": "CASE-XXX",
      "similarity": "High | Medium | Low",
      "matchReason": "<1–2 sentences>",
      "suggestedFix": "<concrete next step>"
    }
  ]
}`,
    test: `Role: Senior QA engineer.
Task: Generate 6 test cases covering Unit, Integration, E2E, Regression.
Output schema:
{
  "mode": "test",
  "issue": "<original issue>",
  "results": [
    {
      "testId": "TC-001",
      "type": "Unit | Integration | E2E | Regression",
      "title": "<test name>",
      "preconditions": "<setup required>",
      "steps": ["<step 1>", "<step 2>", "<step 3>"],
      "expectedResult": "<what must be true>",
      "priority": "High | Medium | Low"
    }
  ]
}`,
    rootcause: `Role: Principal engineer conducting post-mortem.
Task: Identify the most likely root cause.
Output schema:
{
  "mode": "rootcause",
  "issue": "<original issue>",
  "results": {
    "primaryCause": "<technical root cause>",
    "causeCategory": "<Race Condition | Memory Leak | Config Error | Missing Validation | Architectural Flaw | Dependency Failure | Data Corruption | Other>",
    "relatedCaseIds": ["CASE-XXX", "CASE-YYY"],
    "evidence": "<2–3 sentences citing historical patterns>",
    "confidence": "High | Medium | Low",
    "immediateAction": "<what to do in the next 30 minutes>",
    "permanentFix": "<what to do in the next sprint>"
  }
}`,
    prevention: `Role: SRE and DevOps architect.
Task: Suggest 6 concrete prevention strategies.
Output schema:
{
  "mode": "prevention",
  "issue": "<original issue>",
  "results": [
    {
      "category": "Code | Testing | Monitoring | Architecture | Process | Tooling",
      "recommendation": "<specific, actionable title>",
      "priority": "High | Medium | Low",
      "effort": "Low | Medium | High",
      "implementation": "<2–3 sentences: exactly how to implement>",
      "successMetric": "<how to know this prevention is working>"
    }
  ]
}`
  };

  return `You are an expert SDLC analyst with access to historical issue cases.

HISTORICAL CASES:
${casesList}

${modeInstructions[mode]}

USER ISSUE:
${issue}

Return ONLY valid JSON. No explanation, no markdown.`;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    casesLoaded: cases.length,
    aiProvider: 'Ollama'
  });
});

// Analyze endpoint
app.post('/analyze', async (req, res) => {
  try {
    const { issue, mode } = req.body;

    // Validation
    if (!issue || typeof issue !== 'string' || issue.trim().length === 0) {
      return res.status(400).json({ error: 'Issue description is required and must be a non-empty string' });
    }

    const validModes = ['debug', 'test', 'rootcause', 'prevention'];
    if (!mode || !validModes.includes(mode)) {
      return res.status(400).json({ error: `Mode must be one of: ${validModes.join(', ')}` });
    }

    // Build prompt
    const prompt = buildPrompt(issue, mode, cases);

    // Call Ollama API
    const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: 'You are an expert Senior Engineer.' },
          { role: 'user', content: prompt }
        ],
        stream: false,
        options: {
          temperature: 0.2,
          num_predict: 1500
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API error:', response.status, errorText);
      return res.status(502).json({
        error: `Ollama API request failed: ${response.status} ${response.statusText}`
      });
    }

    const data = await response.json();
    
    if (!data.message || !data.message.content) {
      console.error('Unexpected Ollama API response structure:', data);
      return res.status(502).json({ error: 'Unexpected response structure from Ollama API' });
    }

    let raw = data.message.content;

    // Strip markdown fences
    raw = raw.replace(/```json\n?|```\n?/g, '').trim();

    // Parse JSON
    let parsedResult;
    try {
      parsedResult = JSON.parse(raw);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Raw response:', raw);
      return res.status(502).json({ error: 'Failed to parse Ollama API response as JSON' });
    }

    // Return success
    res.json({
      success: true,
      data: parsedResult,
      provider: 'Ollama'
    });

  } catch (error) {
    console.error('Analyze endpoint error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Code generation endpoint
app.post('/codegen', async (req, res) => {
  try {
    const { prompt, language } = req.body;

    // Validation
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required and must be a non-empty string' });
    }

    const lang = language || 'javascript';

    // Build code generation prompt
    const codePrompt = `You are an expert software engineer. Generate clean, production-ready code based on the following request.

Language: ${lang}
Request: ${prompt}

Output schema (return ONLY valid JSON):
{
  "language": "${lang}",
  "code": "<complete working code>",
  "explanation": "<brief explanation of what the code does>",
  "usage": "<how to use this code>"
}

Return ONLY valid JSON. No markdown, no code fences.`;

    // Call Ollama API
    const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: 'You are an expert software engineer who writes clean, efficient code.' },
          { role: 'user', content: codePrompt }
        ],
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 2000
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API error:', response.status, errorText);
      return res.status(502).json({
        error: `Ollama API request failed: ${response.status} ${response.statusText}`
      });
    }

    const data = await response.json();
    
    if (!data.message || !data.message.content) {
      console.error('Unexpected Ollama API response structure:', data);
      return res.status(502).json({ error: 'Unexpected response structure from Ollama API' });
    }

    let raw = data.message.content;

    // Strip markdown fences
    raw = raw.replace(/```json\n?|```\n?/g, '').trim();

    // Parse JSON
    let parsedResult;
    try {
      parsedResult = JSON.parse(raw);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Raw response:', raw);
      return res.status(502).json({ error: 'Failed to parse Ollama API response as JSON' });
    }

    // Return success
    res.json({
      success: true,
      data: parsedResult,
      provider: 'Ollama'
    });

  } catch (error) {
    console.error('Codegen endpoint error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('SDLC Issue Analysis Assistant - Backend Server');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Ollama API URL : ${OLLAMA_API_URL}`);
  console.log(`Ollama Model   : ${OLLAMA_MODEL}`);
  console.log(`Cases loaded: ${cases.length}`);
  console.log(`Server ready: http://localhost:${PORT}`);
  console.log('═══════════════════════════════════════════════════════');
});

// Made with Bob
