const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a friendly and efficient recipe assistant that helps users capture their recipes in a structured format for Recime, a recipe management app.

Your goal is to extract the following information through natural conversation:
- Recipe title
- Number of servings
- Prep time (in minutes)
- Cook time (in minutes)
- Ingredients (each with quantity, unit, and ingredient name)
- Step-by-step instructions (clear, numbered steps)
- Optional notes or tips

Conversation process:
1. First turn (no prior messages): Warmly greet the user and ask them to describe their recipe
2. As they describe it, extract what you can from their message
3. Ask targeted follow-up questions ONLY for fields that are still missing or unclear — don't ask for things already provided
4. Be conversational and friendly, not robotic
5. When all required fields are complete (title, servings, prep time, cook time, ingredients with quantities, and clear instructions), set isComplete to true

CRITICAL: Always respond with ONLY a valid JSON object — no text before or after. Use this exact structure:
{
  "message": "Your friendly conversational response",
  "recipeData": {
    "title": null,
    "servings": null,
    "prepTime": null,
    "cookTime": null,
    "ingredients": [],
    "instructions": [],
    "notes": null
  },
  "isComplete": false
}

Notes on data types:
- servings, prepTime, cookTime: numbers (integers)
- ingredients: array of {"qty": "string", "unit": "string", "ingredient": "string"} — qty and unit can be empty strings if not applicable (e.g., "2 eggs" → qty:"2", unit:"", ingredient:"eggs")
- instructions: array of strings, each being one clear step
- isComplete: set to true ONLY when all required fields have values

When isComplete is true, your message should say something warm like: "Perfect! I have everything I need. Click below to generate your recipe and a beautiful photo!"`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    // Convert messages to Anthropic format (user/assistant only)
    const anthropicMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

    // If no messages yet, start with a user prompt to trigger the greeting
    const messagesToSend = anthropicMessages.length === 0
      ? [{ role: 'user', content: 'Hello, I want to capture a recipe.' }]
      : anthropicMessages;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messagesToSend
    });

    const rawText = response.content[0].text.trim();

    // Parse JSON response
    let content;
    try {
      content = JSON.parse(rawText);
    } catch (e) {
      // Try to extract JSON from text
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        content = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    res.json(content);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate', async (req, res) => {
  try {
    const { recipeData } = req.body;

    // Format the Recime-compatible text
    const recipeText = formatRecipeText(recipeData);

    // Generate image via Gemini
    let imageBase64 = null;
    let imageMimeType = null;

    try {
      const ingredients = recipeData.ingredients
        .slice(0, 5)
        .map(i => `${i.qty} ${i.unit} ${i.ingredient}`.trim())
        .join(', ');

      const prompt = `A professional food photography shot of ${recipeData.title}: a beautifully prepared dish featuring ${ingredients}. Overhead angle, natural lighting, garnished and plated beautifully on a clean surface.`;

      const geminiResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
        },
        { timeout: 60000 }
      );

      const parts = geminiResponse.data?.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          imageBase64 = part.inlineData.data;
          imageMimeType = part.inlineData.mimeType;
          break;
        }
      }
    } catch (imgError) {
      console.error('Image generation failed (non-fatal):', imgError.message);
    }

    res.json({ recipeText, imageBase64, imageMimeType });
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ error: error.message });
  }
});

function formatRecipeText(data) {
  let text = `${data.title}\n\n`;
  text += `Servings: ${data.servings}\n`;
  text += `Prep time: ${data.prepTime} minutes\n`;
  text += `Cook time: ${data.cookTime} minutes\n\n`;
  text += `Ingredients:\n`;
  for (const ing of data.ingredients) {
    const qty = ing.qty ? `${ing.qty} ` : '';
    const unit = ing.unit ? `${ing.unit} ` : '';
    text += `- ${qty}${unit}${ing.ingredient}\n`;
  }
  text += `\nInstructions:\n`;
  data.instructions.forEach((step, i) => {
    text += `${i + 1}. ${step}\n`;
  });
  if (data.notes) {
    text += `\nNotes:\n${data.notes}`;
  }
  return text;
}

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Recipe Capture server running on port ${PORT}`));
