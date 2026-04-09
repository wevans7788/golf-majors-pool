/**
 * Netlify Function: LLM Analysis Proxy
 * Handles Hugging Face Inference API requests for AI content generation
 */

// Hugging Face configuration
const HF_API_URL = 'https://api-inference.huggingface.co/models';
const DEFAULT_MODEL = 'mistralai/Mixtral-8x7B-Instruct-v0.1';

// Simple response cache for repeated requests
const responseCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Make request to Hugging Face Inference API
 */
async function queryHuggingFace(model, prompt, parameters = {}) {
  const url = `${HF_API_URL}/${model}`;

  // For demo purposes, we'll use the free inference API without authentication
  // In production, you would add: 'Authorization': `Bearer ${process.env.HF_API_TOKEN}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${process.env.HF_API_TOKEN}`, // Uncomment when you have a token
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 400,
        temperature: 0.7,
        do_sample: true,
        ...parameters
      },
      options: {
        wait_for_model: true,
        use_cache: false
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} - ${error}`);
  }

  const result = await response.json();

  // Handle different response formats
  if (Array.isArray(result) && result.length > 0) {
    return result[0].generated_text || result[0].text;
  }

  if (result.generated_text) {
    return result.generated_text;
  }

  throw new Error('Unexpected response format from Hugging Face API');
}

/**
 * Get cached response or generate new one
 */
async function getCachedResponse(cacheKey, generator) {
  const cached = responseCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }

  const data = await generator();
  responseCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

/**
 * Generate fallback content when AI is unavailable
 */
function generateFallbackContent(promptType, context = {}) {
  const fallbacks = {
    'pool_summary': `Pool Update: The competition continues to heat up with ${context.leader || 'our current leader'} maintaining their position. Tournament action and strategic picks are creating an exciting dynamic in the standings. Participants should stay tuned for upcoming major championships and new scoring opportunities.`,

    'tournament_recap': `Tournament Recap: Another exciting major championship has concluded, showcasing incredible golf and impacting our pool standings. The final results have shifted the leaderboard and created new opportunities for participants in upcoming events.`,

    'player_analysis': `Player Analysis: This golfer brings valuable experience and competitive skills to major championships. Pool participants who selected this player should monitor their performance for potential scoring opportunities throughout the tournament season.`,

    'tournament_preview': `Tournament Preview: The upcoming major championship promises exciting golf and significant pool implications. Participants should analyze their picks and prepare for potential scoring opportunities as the tournament unfolds.`,

    'default': 'Golf analysis content is currently being generated. Please check back shortly for detailed insights and commentary.'
  };

  return fallbacks[promptType] || fallbacks.default;
}

/**
 * Main handler function
 */
exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { prompt, model = DEFAULT_MODEL, parameters = {} } = JSON.parse(event.body || '{}');

    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Prompt is required' })
      };
    }

    // Create cache key based on prompt and parameters
    const cacheKey = `${model}:${prompt.slice(0, 100)}:${JSON.stringify(parameters)}`;

    // Try to generate AI content
    let generatedText;
    try {
      generatedText = await getCachedResponse(cacheKey, async () => {
        return await queryHuggingFace(model, prompt, parameters);
      });
    } catch (aiError) {
      console.log('AI generation failed, using fallback:', aiError.message);

      // Determine content type from prompt for better fallback
      let contentType = 'default';
      if (prompt.includes('weekly summary')) contentType = 'pool_summary';
      else if (prompt.includes('tournament recap')) contentType = 'tournament_recap';
      else if (prompt.includes('player analysis') || prompt.includes('Analyze golfer')) contentType = 'player_analysis';
      else if (prompt.includes('preview') || prompt.includes('upcoming')) contentType = 'tournament_preview';

      generatedText = generateFallbackContent(contentType, {
        leader: prompt.match(/(\w+\s+\w+):\s*\d+\s*points/)?.[1]
      });
    }

    // Clean up the generated text
    const cleanText = generatedText
      .replace(prompt, '') // Remove the original prompt if it appears in response
      .replace(/^["\s]+|["\s]+$/g, '') // Remove quotes and leading/trailing whitespace
      .trim();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        generated_text: cleanText,
        model_used: model,
        timestamp: new Date().toISOString(),
        source: generatedText.includes('Pool Update:') ? 'fallback' : 'ai',
        cache_info: {
          total_entries: responseCache.size,
          cache_hit: responseCache.has(cacheKey)
        }
      })
    };

  } catch (error) {
    console.error('LLM function error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate content',
        message: error.message,
        generated_text: generateFallbackContent('default'),
        source: 'error_fallback'
      })
    };
  }
};

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of responseCache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION) {
      responseCache.delete(key);
    }
  }
}, 10 * 60 * 1000); // Clean up every 10 minutes