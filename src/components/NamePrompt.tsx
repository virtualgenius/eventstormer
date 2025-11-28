import React, { useState } from "react";
import { User } from "lucide-react";

interface NamePromptProps {
  onSubmit: (name: string) => void;
}

export const NamePrompt: React.FC<NamePromptProps> = ({ onSubmit }) => {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName) {
      onSubmit(trimmedName);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full mx-auto mb-4">
            <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>

          <h2 className="text-xl font-semibold text-center text-slate-900 dark:text-slate-100 mb-2">
            Welcome to EventStormer
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
            Enter your name to join the session. Other participants will see this name.
          </p>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
              maxLength={50}
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              Join Session
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
