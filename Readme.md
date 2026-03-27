# SDLC Issue Analysis Assistant

## Problem Statement

Software development teams face recurring issues across the SDLC that consume significant debugging time and resources. When production incidents occur, engineers often:

- Spend hours searching through logs and documentation for similar past issues
- Lack systematic approaches to root cause analysis
- Miss opportunities to prevent recurring problems
- Generate insufficient test coverage for edge cases
- Struggle to identify patterns across historical incidents

This results in:
- Extended mean time to resolution (MTTR)
- Repeated incidents that could have been prevented
- Inefficient use of engineering resources
- Knowledge silos where only senior engineers can quickly diagnose issues

## Solution Overview

The **SDLC Issue Analysis Assistant** is an AI-powered tool that leverages historical issue data and Ollama AI to provide instant, expert-level analysis across four critical dimensions:

### 1. **Debug Mode** 🔍
Instantly finds the 3 most similar historical cases to your current issue, providing:
- Similarity scoring (High/Medium/Low)
- Match reasoning based on symptoms and modules
- Concrete suggested fixes from proven solutions

### 2. **Test Mode** ✓
Generates comprehensive test suites with 6 test cases covering:
- Unit tests for isolated component validation
- Integration tests for system interactions
- End-to-end tests for user workflows
- Regression tests to prevent reoccurrence

### 3. **Root Cause Mode** 🎯
Conducts principal engineer-level post-mortem analysis:
- Identifies primary technical root cause
- Categorizes cause type (Race Condition, Memory Leak, Config Error, etc.)
- Links to related historical cases
- Provides evidence from pattern analysis
- Delivers immediate action plan (30 minutes)
- Suggests permanent fix strategy (next sprint)

### 4. **Prevention Mode** 🛡️
Recommends 6 concrete prevention strategies across:
- Code quality improvements
- Testing enhancements
- Monitoring and observability
- Architectural changes
- Process improvements
- Tooling upgrades

Each recommendation includes priority, effort estimation, implementation steps, and success metrics.

## Value Adds / Differentiators

### 🚀 **Instant Expert Analysis**
- Reduces MTTR from hours to minutes by leveraging 20 historical cases
- Provides senior engineer-level insights to all team members
- Available 24/7 without human bottlenecks

### 🎯 **Multi-Dimensional Approach**
- Unlike single-purpose tools, provides 4 complementary analysis modes
- Covers the full incident lifecycle: detection → diagnosis → resolution → prevention
- Adapts analysis depth based on user needs

### 📊 **Data-Driven Insights**
- Pattern recognition across modules (Authentication, Payment, Database, etc.)
- Evidence-based recommendations from historical data
- Confidence scoring for root cause hypotheses

### 🔄 **Proactive Prevention**
- Transforms reactive debugging into proactive system improvement
- Generates actionable prevention strategies with clear success metrics
- Builds organizational knowledge base over time

### 💡 **Developer Experience**
- Clean, intuitive UI with no learning curve
- One-click example issues for quick testing
- Mobile-responsive design for on-call scenarios
- Real-time analysis with loading states

### 🤖 **Ollama AI Integration**
- Leverages Ollama's advanced reasoning capabilities with local LLM models
- Structured JSON output for reliable parsing
- Temperature-controlled responses (0.2) for consistency
- Optimized prompts for each analysis mode
- Self-hosted solution for data privacy and security

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│                    http://localhost:5173                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP Requests
                             │ (POST /analyze, GET /health)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      VITE DEV SERVER                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React 18 Frontend (SPA)                                 │  │
│  │  ├─ App.jsx (Main Component)                             │  │
│  │  │  ├─ State Management (issue, mode, result, error)    │  │
│  │  │  ├─ Mode Selector (4 buttons)                        │  │
│  │  │  ├─ Issue Input (textarea)                           │  │
│  │  │  ├─ Quick Examples (chips)                           │  │
│  │  │  └─ Results Renderer (mode-specific cards)           │  │
│  │  └─ App.css (Styling)                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Proxy Configuration:                                           │
│  /analyze → http://localhost:3001/analyze                       │
│  /health  → http://localhost:3001/health                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Proxied HTTP
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    EXPRESS BACKEND SERVER                       │
│                    http://localhost:3001                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  server.js (Node.js 18+ / ES Modules)                    │  │
│  │                                                           │  │
│  │  Startup:                                                 │  │
│  │  ├─ Load cases.json (20 historical cases)                │  │
│  │  ├─ Validate environment variables                       │  │
│  │  └─ Initialize Express with CORS                         │  │
│  │                                                           │  │
│  │  Endpoints:                                               │  │
│  │  ├─ GET  /health                                         │  │
│  │  │  └─ Returns: { status, casesLoaded, aiProvider }     │  │
│  │  │                                                        │  │
│  │  └─ POST /analyze                                        │  │
│  │     ├─ Validate: issue (string), mode (enum)            │  │
│  │     ├─ Build prompt with cases + mode instructions      │  │
│  │     ├─ Call Ollama API                                   │  │
│  │     ├─ Parse JSON response                               │  │
│  │     └─ Return: { success, data, provider }              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Data Store:                                                    │
│  └─ cases.json (20 cases × 5 fields each)                      │
│     ├─ id, symptom, module, rootCause, fix                     │
│     └─ Covers 14 modules (Auth, API, Payment, DB, etc.)        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP POST
                             │ /api/chat
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                       OLLAMA AI API                             │
│                  http://9.60.223.58:11434                       │
│                                                                 │
│  Authentication: None (local deployment)                        │
│  Model: codellama (configurable)                                │
│  Request Format: Ollama chat API                                │
│  ├─ model: "codellama"                                          │
│  ├─ messages: [{ role, content }]                               │
│  ├─ stream: false                                               │
│  └─ options: { temperature: 0.2, num_predict: 1500 }           │
│                                                                 │
│  Response Format:                                               │
│  └─ { message: { content: "<JSON>" } }                         │
│                                                                 │
│  Prompt Engineering:                                            │
│  ├─ System: "You are an expert SDLC analyst"                    │
│  └─ User: Historical cases + mode instructions + issue         │
│                                                                 │
│  Mode-Specific Schemas:                                         │
│  ├─ debug:      3 similar cases with fixes                      │
│  ├─ test:       6 test cases (Unit/Integration/E2E/Regression) │
│  ├─ rootcause:  Primary cause + evidence + actions             │
│  └─ prevention: 6 strategies with implementation details       │
└─────────────────────────────────────────────────────────────────┘

DATA FLOW:
1. User selects mode + enters issue → Frontend state update
2. User clicks "Analyze" → POST /analyze via Vite proxy
3. Backend validates input → 400 if invalid
4. Backend builds mode-specific prompt with all 20 cases
5. Backend calls Ollama API with structured prompt
6. Ollama returns JSON analysis (1500 tokens max)
7. Backend strips markdown fences + parses JSON
8. Backend returns { success: true, data: parsed, provider: "Ollama" }
9. Frontend renders mode-specific cards with results
10. User views analysis + can submit new issue

ENVIRONMENT VARIABLES:
Backend (.env):
├─ OLLAMA_API_URL (optional) → Default: http://9.60.223.58:11434
├─ OLLAMA_MODEL   (optional) → Default: codellama
└─ PORT           (optional) → Default: 3001

ERROR HANDLING:
├─ Invalid input → 400 with error message
├─ Ollama API failure → 502 with error details
├─ JSON parse error → 502 with raw response logged
└─ Network errors → 500 with error message

SECURITY:
├─ CORS enabled for local development
├─ No authentication required (local Ollama deployment)
├─ Input validation on all endpoints
└─ No database → No SQL injection risk
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+ (ES Modules)
- **Framework**: Express 4.18.2
- **HTTP Client**: Native `fetch` API
- **Data Storage**: JSON file (cases.json)
- **Dependencies**: express, cors

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.8
- **Styling**: Pure CSS (no UI library)
- **State Management**: React Hooks (useState)
- **HTTP Client**: Native `fetch` API

### AI Integration
- **Provider**: Ollama (Self-hosted LLM)
- **Endpoint**: POST /api/chat
- **Model**: codellama (configurable)
- **Authentication**: None (local deployment)
- **Response Format**: Structured JSON

## Quick Start

### Prerequisites
- Node.js 18 or higher
- Ollama server running at 9.60.223.58:11434

### Step 1: Backend Setup
```bash
cd backend
npm install
```

### Step 2: Environment Configuration (Optional)
```bash
cp .env.example .env
```

The default configuration works out of the box. Edit `.env` only if you need to customize:
```env
OLLAMA_API_URL=http://9.60.223.58:11434
OLLAMA_MODEL=codellama
PORT=3001
```

### Step 3: Start Backend Server
```bash
npm run dev
```

You should see:
```
═══════════════════════════════════════════════════════
SDLC Issue Analysis Assistant - Backend Server
═══════════════════════════════════════════════════════
Using Ollama API at: http://9.60.223.58:11434
Using model: codellama
Cases loaded: 20
Ollama API URL : http://9.60.223.58:11434
Ollama Model   : codellama
Cases loaded: 20
Server ready: http://localhost:3001
═══════════════════════════════════════════════════════
```

### Step 4: Frontend Setup (New Terminal)
```bash
cd frontend
npm install
```

### Step 5: Start Frontend Dev Server
```bash
npm run dev
```

### Step 6: Open Application
Navigate to: **http://localhost:5173**

## Usage Guide

### 1. Select Analysis Mode
Click one of the four mode buttons:
- **Debug** 🔍 - Find similar historical cases
- **Test** ✓ - Generate test cases
- **Root Cause** 🎯 - Identify root cause
- **Prevention** 🛡️ - Get prevention strategies

### 2. Describe Your Issue
Either:
- Type your issue description in the textarea
- Click a quick example chip to auto-fill

### 3. Analyze
Click "Analyze Issue" button. The system will:
- Validate your input
- Send request to Bob AI
- Display results in mode-specific format

### 4. Review Results
Results are displayed as cards with:
- **Debug**: 3 similar cases with similarity scores and fixes
- **Test**: 6 test cases with steps and expected results
- **Root Cause**: Primary cause, evidence, and action plans
- **Prevention**: 6 strategies with implementation details

## API Documentation

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "casesLoaded": 20,
  "aiProvider": "Bob"
}
```

### POST /analyze
Analyze an issue using Bob AI.

**Request:**
```json
{
  "issue": "Users unable to login after password reset",
  "mode": "debug"
}
```

**Valid Modes:** `debug`, `test`, `rootcause`, `prevention`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "mode": "debug",
    "issue": "Users unable to login after password reset",
    "results": [...]
  },
  "provider": "Ollama"
}
```

**Error Response (400/500/502):**
```json
{
  "error": "Error message"
}
```

## Project Structure

```
.
├── backend/
│   ├── cases.json          # 20 historical issue cases
│   ├── package.json        # Backend dependencies
│   ├── server.js           # Express server + Ollama API integration
│   └── .env.example        # Environment template
│
└── frontend/
    ├── src/
    │   ├── App.jsx         # Main React component
    │   ├── App.css         # Application styles
    │   └── main.jsx        # React entry point
    ├── index.html          # HTML template
    ├── package.json        # Frontend dependencies
    └── vite.config.js      # Vite configuration + proxy
```

## Demo Video

**Box Link:** Your_Team_Name/demo.mp4

The demo video showcases:
1. Application startup and health check
2. Debug mode analysis with similar case matching
3. Test mode generating comprehensive test suites
4. Root cause analysis with evidence and action plans
5. Prevention mode with implementation strategies
6. Mobile responsive design
7. Error handling and validation

## Future Enhancements

- **Database Integration**: Store analysis history and user feedback
- **Case Management**: Add/edit/delete historical cases via UI
- **Advanced Analytics**: Track MTTR improvements and pattern trends
- **Team Collaboration**: Share analyses and add comments
- **Slack/Teams Integration**: Receive analysis results in chat
- **Custom Models**: Support for multiple AI providers
- **Export Functionality**: Download analyses as PDF/Markdown
- **Real-time Monitoring**: Integrate with observability platforms

## License

MIT

## Support

For issues or questions, please contact the development team or refer to the Ollama documentation at https://ollama.ai/docs