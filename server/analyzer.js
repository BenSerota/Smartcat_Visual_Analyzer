const OpenAI = require('openai')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// First pass: Extract document context
async function extractDocumentContext(text) {
  const prompt = `Analyze the following text and extract comprehensive context information. Return your analysis as a JSON object with these parameters:

- origin: company/organization/institution name
- authorRole: likely role of the author (e.g., product manager, marketer, engineer)
- targetAudience: who this document is written for
- timeContext: when this was likely written or relevant time period
- domain: industry or field (tech, healthcare, finance, etc.)
- documentType: type of document (marketing copy, technical docs, internal memo, etc.)
- geographicContext: target market or region
- formalityLevel: casual, professional, academic, or legal
- technicalDepth: layperson, intermediate, or expert level
- businessStage: startup, scale-up, enterprise, or government
- regulatoryContext: any compliance requirements mentioned

Also include:
- potentialTerms: list of terms you expect might be glossary candidates based on this context

Text to analyze:
${text.substring(0, 2000)} // Analyze first 2000 chars for context

Return ONLY valid JSON.`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-nano-2025-08-07",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" }
    })

    return JSON.parse(response.choices[0].message.content)
  } catch (error) {
    console.error('Error extracting context:', error)
    throw error
  }
}

// Second pass: Extract glossary terms based on context
async function extractGlossaryTerms(text, context) {
  const contextSummary = Object.entries(context)
    .filter(([key]) => key !== 'potentialTerms')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')

  const prompt = `You are analyzing a document with the following context:
${contextSummary}

Expected terms based on context: ${context.potentialTerms?.join(', ') || 'None identified'}

Now analyze the full text and identify ALL terms that should NOT be translated. Include:
1. Company/organization names
2. Product names and features
3. Technical terms that should remain in English
4. Acronyms
5. Any other context-specific terms that would lose meaning if translated

For each term, provide:
- term: the exact term as it appears
- category: one of [company, product, technical, acronym, other]
- confidence: one of [high, medium, low]
- context: a short snippet showing how it's used
- frequency: approximate number of occurrences

Important: Be comprehensive but accurate. Include terms like "${context.potentialTerms?.[0] || 'API'}" if they appear.

Text to analyze:
${text}

Return ONLY a valid JSON object with a "terms" array.`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-nano-2025-08-07",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" }
    })

    const result = JSON.parse(response.choices[0].message.content)
    
    // Add unique IDs to each term
    if (result.terms) {
      result.terms = result.terms.map((term, index) => ({
        id: `term-${Date.now()}-${index}`,
        ...term
      }))
    }

    return result
  } catch (error) {
    console.error('Error extracting terms:', error)
    throw error
  }
}

async function analyzeDocument(text) {
  try {
    // First pass: Extract context
    console.log('Extracting document context...')
    const context = await extractDocumentContext(text)
    console.log('Context extracted:', context)

    // Second pass: Extract terms based on context
    console.log('Extracting glossary terms...')
    const termsResult = await extractGlossaryTerms(text, context)
    
    return {
      context,
      terms: termsResult.terms || []
    }
  } catch (error) {
    console.error('Error in document analysis:', error)
    throw error
  }
}

module.exports = {
  analyzeDocument
}
