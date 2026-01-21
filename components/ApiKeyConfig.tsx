import React, { useState } from 'react';
import { AppConfig } from '../types';

interface ApiKeyConfigProps {
  onConfigSave: (config: AppConfig) => void;
  existingConfig: AppConfig;
}

export const ApiKeyConfig: React.FC<ApiKeyConfigProps> = ({ onConfigSave, existingConfig }) => {
  const [geminiKey, setGeminiKey] = useState(existingConfig.geminiApiKey);
  const [clientId, setClientId] = useState(existingConfig.googleClientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfigSave({
      ...existingConfig,
      geminiApiKey: geminiKey,
      googleClientId: clientId
    });
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-2xl">
      <h2 className="text-2xl font-bold mb-6 text-white text-center">Configuration</h2>
      <p className="text-zinc-400 text-sm mb-6 text-center">
        To use Screen Longshot, you need your own API keys.
        The Google Client ID is required to save files to your Drive.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Gemini API Key</label>
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="AIzaSy..."
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Google Cloud Client ID</label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="12345...apps.googleusercontent.com"
            required
          />
          <p className="text-xs text-zinc-500 mt-1">Must have "https://apis.google.com/js/api.js" and your domain in Authorized Origins.</p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors mt-4"
        >
          Save & Continue
        </button>
      </form>
    </div>
  );
};
