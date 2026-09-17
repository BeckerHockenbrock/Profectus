"use client";

import { useState } from "react";
import { getStoredGeminiApiKey } from "../data/journal-storage";

interface JournalKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKey: (key: string) => void;
}

export function JournalKeyModal({ isOpen, onClose, onSaveKey }: JournalKeyModalProps) {
  const [apiKeyInput, setApiKeyInput] = useState(() => getStoredGeminiApiKey());
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKey(apiKeyInput.trim());
    setIsSavedNotice(true);
    setTimeout(() => {
      setIsSavedNotice(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setApiKeyInput("");
    onSaveKey("");
    onClose();
  };

  return (
    <div className="journalModalOverlay" role="dialog" aria-modal="true" aria-labelledby="gemini-key-title">
      <div className="journalModalCard">
        <div className="journalModalHeader">
          <div className="journalModalTitleGroup">
            <span className="geminiSparkleIcon" aria-hidden="true">✨</span>
            <h3 id="gemini-key-title">Gemini Flash Setup</h3>
          </div>
          <button
            type="button"
            className="journalModalClose"
            onClick={onClose}
            aria-label="Close Gemini settings"
          >
            ✕
          </button>
        </div>

        <p className="journalModalSubtitle">
          Altiora connects to Google Gemini Flash (Free Tier) to evaluate your daily reflections and award points across the 6 life stats.
        </p>

        <form onSubmit={handleSave} className="journalKeyForm">
          <label className="journalKeyLabel" htmlFor="gemini-api-key-input">
            Gemini API Key
          </label>
          <input
            id="gemini-api-key-input"
            type="password"
            className="journalKeyInput"
            placeholder="AIzaSy..."
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />

          <div className="journalKeyHintBox">
            <p className="journalKeyHint">
              💡 <strong>Tip:</strong> You can get a free key from{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="journalExternalLink"
              >
                Google AI Studio
              </a>
              . Alternatively, add <code>GEMINI_API_KEY=&quot;your-key&quot;</code> directly into <code>web/.env.local</code>.
            </p>
          </div>

          <div className="journalKeyActions">
            {apiKeyInput ? (
              <button
                type="button"
                className="journalKeyBtnSecondary"
                onClick={handleClear}
              >
                Clear Key
              </button>
            ) : null}
            <button
              type="submit"
              className="journalKeyBtnPrimary"
            >
              {isSavedNotice ? "Saved!" : "Save & Connect"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
