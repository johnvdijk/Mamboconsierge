const fetch = require('node-fetch');

/*
 * Serverless function to handle concierge chat requests.
 *
 * This function expects a JSON payload with a single property, `message`,
 * which contains the user's question.  It forwards the message to the
 * OpenAI Chat Completions API using the API key stored in the
 * OPENAI_API_KEY environment variable and returns the assistant's reply.
 *
 * To use this function on Netlify, place it under `netlify/functions/chat.js`.
 * Netlify automatically exposes the function at the URL
 * `/.netlify/functions/chat`.  On Vercel, place it under `api/chat.js` and
 * export a default function instead of `exports.handler`.
 */

exports.handler = async (event) => {
  try {
    // Parse the incoming request body.  The body will be a JSON string
    // containing the user's message.
    const { message } = JSON.parse(event.body || '{}');

    // Validate the message.
    if (!message) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid request: no message provided' }),
      };
    }

    // Prepare the request to the OpenAI API.  Note that the API key must be
    // stored in an environment variable named OPENAI_API_KEY.  Never
    // hard-code API keys in your source code or expose them in client-side
    // scripts.  See Netlify and Vercel documentation for how to set
    // environment variables securely.
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Server configuration error: OPENAI_API_KEY not set' }),
      };
    }

    const openaiUrl = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are the One Mambo Beach concierge AI.' },
        { role: 'user', content: message },
      ],
    };

    const response = await fetch(openaiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Forward the error to the client if the OpenAI API returns an error.
      const errorBody = await response.text();
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: errorBody }),
      };
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Unknown error' }),
    };
  }
};
