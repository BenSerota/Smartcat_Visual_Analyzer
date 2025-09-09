# Visual Segmenter

An AI-powered tool that analyzes PowerPoint presentations using visual context to create optimal text segmentation for translation purposes. This tool leverages GPT-5 Nano's visual analysis capabilities to understand slide layouts and text relationships that traditional rule-based segmentation might miss.

## Features

- **Visual Context Analysis**: Uses OpenAI GPT-5-nano to analyze slide images and understand visual relationships between text elements
- **Intelligent Segmentation**: Combines textual rules with visual insights to create better translation segments
- **High-Resolution Segmentation**: Segments at the highest possible resolution (slide + text element + visual context + coordinates)
- **Visual Preview**: Interactive preview showing visual contexts overlaid on slide images
- **Segmentation Review**: Review and edit AI-generated segmentation before export
- **XLIFF Export**: Export results in XLIFF format with visual context metadata

## Prerequisites

- Node.js (v16 or higher)
- npm
- OpenAI API key with access to GPT-5-nano model
- PowerPoint files (.pptx) for analysis

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

1. **Upload PowerPoint**: Drag and drop a `.pptx` file (max 10MB) or click to browse
2. **Visual Analysis**: The AI analyzes each slide's visual layout and text relationships
3. **Preview Results**: Review visual contexts overlaid on slide images
4. **Edit Segmentation**: Review and modify the AI-generated segmentation
5. **Export XLIFF**: Download the segmented content in XLIFF format with visual context metadata

## File Size Limitations

The MVP version supports PowerPoint files up to 10MB. Larger files may need to be optimized or split.

## Supported File Types

Currently supports PowerPoint `.pptx` files only. Support for other presentation formats is planned for future versions.

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **AI**: OpenAI GPT-5-nano with visual analysis capabilities
- **PowerPoint Processing**: PptxGenJS for file parsing and slide extraction
- **Image Processing**: Sharp for slide image generation
- **File Upload**: Multer v2

## Development

The project structure:
```
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── FileUpload.tsx  # PowerPoint file upload
│   │   └── ResultsDisplay.tsx # Visual analysis preview
│   ├── App.tsx            # Main app component
│   └── types.ts           # TypeScript definitions for visual segmentation
├── server/                # Backend server
│   ├── index.js           # Express server with PowerPoint endpoint
│   ├── powerpoint-processor.js # PowerPoint file processing
│   ├── visual-analyzer.js # GPT-5 Nano visual analysis
│   └── analyzer.js        # Legacy text analysis (for reference)
├── development_plan.md    # Detailed development plan
└── goals                  # Original project goals
```

## Contributing

This is currently a prototype/MVP. See `development_plan.md` for the full roadmap and planned enhancements.

## License

This project is proprietary and confidential.
