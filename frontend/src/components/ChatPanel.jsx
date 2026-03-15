import React, { useState, useRef, useEffect } from 'react';
import './ChatPanel.css';

function ProgressBadge({ recipeData }) {
  const fields = [
    { key: 'title', label: 'Title' },
    { key: 'servings', label: 'Servings' },
    { key: 'prepTime', label: 'Prep time' },
    { key: 'cookTime', label: 'Cook time' },
    { key: 'ingredients', label: 'Ingredients', check: v => v && v.length > 0 },
    { key: 'instructions', label: 'Instructions', check: v => v && v.length > 0 },
  ];

  const filled = fields.filter(f => {
    const val = recipeData[f.key];
    if (f.check) return f.check(val);
    return val != null && val !== '';
  });

  const pct = Math.round((filled.length / fields.length) * 100);

  return (
    <div className="progress-badge">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-fields">
        {fields.map(f => {
          const done = filled.some(x => x.key === f.key);
          return (
            <span key={f.key} className={`field-chip ${done ? 'done' : ''}`}>
              {done ? '✓' : '·'} {f.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function ChatPanel({ messages, isLoading, isComplete, isGenerating, onSend, onGenerate, recipeData }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    onSend(text);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.length === 0 && !isLoading && (
          <div className="chat-empty">
            <span className="chat-empty-icon">👨‍🍳</span>
            <p>Starting your recipe session...</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.role}`}>
            {msg.role === 'assistant' && (
              <span className="avatar">🍳</span>
            )}
            <div className={`bubble ${msg.role}`}>
              {msg.content.split('\n').map((line, j) => (
                <React.Fragment key={j}>
                  {line}
                  {j < msg.content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message-row assistant">
            <span className="avatar">🍳</span>
            <div className="bubble assistant typing">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-footer">
        <ProgressBadge recipeData={recipeData} />

        {isComplete && (
          <div className="generate-section">
            <button
              className="btn-generate"
              onClick={onGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="spinner" />
                  Generating recipe & photo...
                </>
              ) : (
                <>
                  ✨ Generate Recipe & Photo
                </>
              )}
            </button>
          </div>
        )}

        <form className="chat-input-row" onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your recipe or answer the question above..."
            rows={2}
            disabled={isLoading || isGenerating}
          />
          <button
            type="submit"
            className="btn-send"
            disabled={!input.trim() || isLoading || isGenerating}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
