# Visual Segmenter - Development Plan

## Project Overview
Build a web-based tool that analyzes PowerPoint presentations using visual context to create optimal text segmentation for translation purposes. This tool leverages GPT-5 Nano's visual analysis capabilities to understand slide layouts and text relationships that traditional rule-based segmentation might miss.

## Core Objectives

### Primary Goal
- Accept a PowerPoint file as input and output optimal text segmentation for translation
- Use LLM-based visual analysis to understand slide layouts and text relationships
- Create high-resolution segmentation that considers visual context

### Secondary Goals
- Provide confidence scores for segmentation decisions
- Allow user review and editing of segmentation suggestions
- Export results in XLIFF format with visual context metadata

## Technical Architecture

### Frontend
- Simple, modern web interface with file upload capability
- React-based SPA for responsive user experience
- Components:
  - File upload area (drag-and-drop support)
  - Processing status indicator
  - Results display with categorized terms
  - Export options

### Backend
- Node.js/Express server (or Python/FastAPI alternative)
- OpenAI API integration for LLM processing
- File handling and text extraction

### LLM Integration
- Use OpenAI GPT-5-nano-2025-08-07 API for context analysis
- Two-pass processing approach:
  1. Context extraction with multiple orthogonal parameters:
     - **Document origin**: company/organization/institution
     - **Author role**: product manager, marketer, engineer, physician, etc.
     - **Target audience**: internal team, customers, investors, general public
     - **Time context**: when written (recent events, legacy references)
     - **Domain/industry**: tech, healthcare, finance, manufacturing, etc.
     - **Document type**: marketing copy, technical docs, internal memo, user guide
     - **Geographic context**: target market/region (US, EU, global, specific country)
     - **Formality level**: casual, professional, academic, legal
     - **Technical depth**: layperson, intermediate, expert level
     - **Business stage**: startup, scale-up, enterprise, government
     - **Regulatory context**: compliance requirements (GDPR, HIPAA, etc.)
  2. Term identification based on comprehensive context analysis

## Detailed Implementation Plan

### Phase 1: Core Infrastructure
1. **Project Setup**
   - Initialize project with chosen tech stack
   - Set up development environment
   - Configure build tools and linting

2. **Version Control Setup**
   - Initialize git repository
   - Create new project in GitHub at: https://github.com/BenSerota/SmartcatMockups
   - Set up remote origin: `git remote add origin https://github.com/BenSerota/SmartcatMockups.git`
   - Initial commit with project structure
   - Set up .gitignore (include .env, node_modules, build artifacts)
   - Regular commits and pushes throughout development

3. **API Key Management**
   - Environment variable configuration (.env file)
   - Secure key storage (never commit to version control)
   - Runtime validation of API key presence

4. **Basic File Upload**
   - Create upload endpoint
   - Support for .txt files initially
   - File size validation (suggest 100KB limit for MVP)
   - Basic error handling

### Phase 2: LLM Integration
1. **Context Analysis Module**
   - Prompt engineering for document analysis
   - Extract: company/organization, author role, target audience
   - Generate associated terminology predictions

2. **Term Extraction Module**
   - Second-pass analysis with context
   - Identify potential glossary terms
   - Categorize terms (company names, products, technical terms, acronyms)

3. **Confidence Scoring**
   - Implement basic confidence metrics
   - Consider factors: capitalization, frequency, context clues

### Phase 3: User Interface
1. **Upload Interface**
   - Drag-and-drop file upload
   - File preview functionality
   - "Suggest Glossary" button

2. **Results Display**
   - Categorized term list
   - Confidence indicators (high/medium/low)
   - Inline editing capabilities
   - Add/remove terms manually

3. **Export Functionality**
   - CSV export (term, category, confidence)
   - JSON export for programmatic use
   - TMX format for CAT tools

### Phase 4: Enhancement & Polish
1. **User Experience**
   - Loading states and progress indicators
   - Error messages and recovery options
   - Responsive design for mobile/tablet

2. **Additional File Formats**
   - PDF support using pdf-parse or similar
   - DOCX support using mammoth or similar
   - Plain HTML support

3. **Performance Optimization**
   - Implement text chunking for large files
   - Cache results for recently processed files
   - Optimize API calls to minimize costs

## API Key Management

### Development Environment
For local development, use a `.env` file:
```
OPENAI_API_KEY=your-api-key-here
```

### Security Best Practices
1. Add `.env` to `.gitignore` immediately
2. Use environment variables in production
3. Never expose API key to frontend
4. Implement rate limiting on backend
5. Add request authentication for production use

### Cursor IDE Integration
Unfortunately, Cursor doesn't have a built-in secrets manager. Best practices:
1. Create a `.env.example` file with placeholder
2. Use dotenv package to load environment variables
3. Add setup instructions in README
4. Consider using a secrets manager for production (AWS Secrets Manager, etc.)

## Language Support
- MVP focuses on English-language documents only
- LLM naturally supports multiple languages but we'll optimize prompts for English
- UI and instructions in English
- Future versions can add multi-language support

## Success Metrics
- Accuracy: 80%+ of suggested terms are valid glossary entries
- Performance: Process average document (5-10 pages) in <30 seconds
- User satisfaction: Allow easy correction of suggestions
- Cost efficiency: Average <$0.10 per document processed

## MVP Exclusions
- Batch processing (single file only)
- User accounts/authentication
- Historical data storage
- Advanced NLP features beyond LLM
- Multi-language UI support

## Next Steps
1. Review and approve this plan
2. Set up project structure
3. Implement Phase 1 infrastructure
4. Create initial LLM prompts
5. Build minimal UI
6. Test with sample documents
7. Iterate based on results
