'use client';

import { useEffect, useState } from 'react';
import { useSystemConfig } from '@/hooks/useSystemConfig';

export default function SystemConfigPanel() {
  const { config, isLoading, error, save, refresh } = useSystemConfig();
  const [teams, setTeams] = useState<string[]>([]);
  const [newTeam, setNewTeam] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setTeams(config?.teams ?? []);
  }, [config?.teams]);

  const addTeam = () => {
    const trimmed = newTeam.trim();
    if (!trimmed) return;
    if (teams.includes(trimmed)) {
      setFeedback({ kind: 'error', text: 'הצוות כבר קיים' });
      return;
    }
    setTeams((prev) => [...prev, trimmed]);
    setNewTeam('');
    setFeedback(null);
  };

  const removeTeam = (name: string) => {
    setTeams((prev) => prev.filter((t) => t !== name));
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    const ok = await save({ teams });
    setSaving(false);
    if (ok) {
      setFeedback({ kind: 'success', text: 'נשמר בהצלחה' });
      await refresh();
    } else {
      setFeedback({ kind: 'error', text: 'שמירה נכשלה' });
    }
  };

  if (isLoading) {
    return <p className="text-sm text-neutral-500">טוען הגדרות...</p>;
  }

  return (
    <div className="space-y-6">
      <section>
        <h4 className="font-semibold text-neutral-900 mb-2">צוותים</h4>
        <p className="text-sm text-neutral-600 mb-3">
          רשימת הצוותים הזמינה למשתמשים בעת רישום ובהגדרות פרופיל.
        </p>

        {error && (
          <p className="text-sm text-danger-600 mb-2">{error}</p>
        )}

        <ul className="space-y-2 mb-4">
          {teams.length === 0 && (
            <li className="text-sm text-neutral-500 italic">אין עדיין צוותים — הוסף אחד למטה.</li>
          )}
          {teams.map((team) => (
            <li key={team} className="flex items-center justify-between bg-neutral-50 px-3 py-2 rounded-lg">
              <span>{team}</span>
              <button
                type="button"
                onClick={() => removeTeam(team)}
                className="text-danger-600 hover:text-danger-800 text-sm"
              >
                הסר
              </button>
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <input
            type="text"
            value={newTeam}
            onChange={(e) => setNewTeam(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTeam();
              }
            }}
            placeholder="שם צוות חדש"
            className="input-base flex-1"
          />
          <button type="button" onClick={addTeam} className="btn-secondary">
            הוסף
          </button>
        </div>
      </section>

      {feedback && (
        <p
          className={`text-sm ${
            feedback.kind === 'success' ? 'text-success-700' : 'text-danger-600'
          }`}
        >
          {feedback.text}
        </p>
      )}

      <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? 'שומר...' : 'שמור שינויים'}
      </button>
    </div>
  );
}
