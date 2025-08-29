# Glossary Suggester

An AI-powered tool that analyzes text documents and automatically suggests terms that should NOT be translated when localizing content to other languages.

## Features

- **Intelligent Context Analysis**: Uses OpenAI GPT-5-nano to understand document context before identifying terms
- **Two-Pass Analysis**: 
  1. Extracts comprehensive document context (origin, author role, audience, etc.)
  2. Identifies glossary terms based on that context
- **Categorized Results**: Terms are organized by category (company, product, technical, acronym, other)
- **Confidence Scoring**: Each term includes a confidence level (high, medium, low)
- **Interactive Editing**: Review and edit suggested terms before export
- **Export Options**: Download results as CSV or JSON

## Prerequisites

- Node.js (v16 or higher)
- npm
- OpenAI API key with access to GPT-5-nano model

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/BenSerota/SmartcatMockups.git -b glossary_suggestor
   cd SmartcatMockups
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   OPENAI_API_KEY=your-openai-api-key-here
   PORT=3001
   ```

## Running the Application

1. Start the backend server:
   ```bash
   npm run server
   ```

2. In a new terminal, start the frontend development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5173`

## Usage

1. **Upload a File**: Drag and drop a `.txt` file (max 100KB for MVP) or click to browse
2. **Wait for Analysis**: The AI will analyze your document in two passes
3. **Review Results**: Terms are displayed by category with confidence scores
4. **Edit as Needed**: Click "Edit" on any term to modify it, or "Delete" to remove
5. **Export**: Download your glossary as CSV or JSON

## File Size Limitations

The MVP version supports files up to 100KB. Larger files will need to be split or summarized.

## Supported File Types

Currently supports `.txt` files only. Support for PDF and DOCX is planned for future versions.

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **AI**: OpenAI GPT-5-nano
- **File Upload**: Multer v2

## Development

The project structure:
```
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── App.tsx            # Main app component
│   └── types.ts           # TypeScript definitions
├── server/                # Backend server
│   ├── index.js           # Express server
│   └── analyzer.js        # OpenAI integration
├── development_plan.md    # Detailed development plan
└── goals                  # Original project goals
```

## Contributing

This is currently a prototype/MVP. See `development_plan.md` for the full roadmap and planned enhancements.

## License

This project is proprietary and confidential.
