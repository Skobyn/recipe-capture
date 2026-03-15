import React, { useState, useRef, useEffect } from 'react';
import ChatPanel from './components/ChatPanel';
import RecipePanel from './components/RecipePanel';
import './App.css';

const initialRecipeData = {
  title: null,
  servings: null,
  prepTime: null,
  cookTime: null,
  ingredients: [],
  instructions: [],
  notes: null
};

export default function App() {
  const [messages, setMessages] = useState([]); // {role, content}
  const [recipeData, setRecipeData] = useState(initialRecipeData);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(null); // {recipeText, imageBase64, imageMimeType}
  const [displayMessages, setDisplayMessages] = useState([]);
  const hasStarted = useRef(false);

  // Kick off with AI greeting on mount
  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      sendToAI([]);
    }
  }, []);

  async function sendToAI(msgs) {
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs })
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      // Update recipe data (merge non-null fields)
      if (data.recipeData) {
        setRecipeData(prev => mergeRecipeData(prev, data.recipeData));
      }

      setIsComplete(data.isComplete || false);

      // Add AI message to display
      setDisplayMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message
      }]);
    } catch (err) {
      console.error(err);
      setDisplayMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, something went wrong. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  function mergeRecipeData(prev, next) {
    const merged = { ...prev };
    if (next.title) merged.title = next.title;
    if (next.servings != null) merged.servings = next.servings;
    if (next.prepTime != null) merged.prepTime = next.prepTime;
    if (next.cookTime != null) merged.cookTime = next.cookTime;
    if (next.ingredients && next.ingredients.length > 0) merged.ingredients = next.ingredients;
    if (next.instructions && next.instructions.length > 0) merged.instructions = next.instructions;
    if (next.notes) merged.notes = next.notes;
    return merged;
  }

  async function handleUserMessage(text) {
    const userMsg = { role: 'user', content: text };
    const newDisplayMessages = [...displayMessages, userMsg];
    setDisplayMessages(newDisplayMessages);

    // Build messages for API (role/content only)
    const apiMessages = newDisplayMessages.map(m => ({ role: m.role, content: m.content }));
    await sendToAI(apiMessages);
  }

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeData })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGenerated(data);
    } catch (err) {
      console.error(err);
      alert('Failed to generate recipe. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleReset() {
    setMessages([]);
    setDisplayMessages([]);
    setRecipeData(initialRecipeData);
    setIsComplete(false);
    setGenerated(null);
    hasStarted.current = false;
    setTimeout(() => {
      hasStarted.current = true;
      sendToAI([]);
    }, 50);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo">🍳</span>
          <div>
            <h1>Recipe Capture</h1>
            <p className="tagline">Describe your recipe → export to Recime</p>
          </div>
        </div>
        <button className="btn-ghost" onClick={handleReset}>New Recipe</button>
      </header>

      <main className={`app-main ${generated ? 'with-result' : ''}`}>
        <ChatPanel
          messages={displayMessages}
          isLoading={isLoading}
          isComplete={isComplete}
          isGenerating={isGenerating}
          onSend={handleUserMessage}
          onGenerate={handleGenerate}
          recipeData={recipeData}
        />

        {generated && (
          <RecipePanel
            recipeText={generated.recipeText}
            imageBase64={generated.imageBase64}
            imageMimeType={generated.imageMimeType}
            recipeName={recipeData.title || 'recipe'}
          />
        )}
      </main>
    </div>
  );
}
