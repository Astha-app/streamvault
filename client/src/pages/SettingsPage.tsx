import React from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import { PLAYBACK_SPEEDS } from '../hooks/useKeyboardShortcuts';
import toast from 'react-hot-toast';

const SHORTCUTS = [
  { keys: 'Space / K', desc: 'Play / Pause' },
  { keys: 'J', desc: 'Seek back 10s' },
  { keys: 'L', desc: 'Seek forward 10s' },
  { keys: '← / →', desc: 'Seek ±5s' },
  { keys: 'Shift + ← / →', desc: 'Seek ±30s' },
  { keys: '↑ / ↓', desc: 'Volume ±10%' },
  { keys: 'M', desc: 'Mute / Unmute' },
  { keys: 'F', desc: 'Fullscreen' },
  { keys: 'T', desc: 'Theater mode' },
  { keys: 'P', desc: 'Picture in Picture' },
  { keys: 'C', desc: 'Toggle captions' },
  { keys: '> / <', desc: 'Speed up / down' },
  { keys: '0–9', desc: 'Seek to 0%–90%' },
  { keys: 'Esc', desc: 'Close menus' },
];

export default function SettingsPage() {
  const { settings, update, reset } = useSettingsStore();
  const { clearUser } = useAuthStore();

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      reset();
      toast.success('Settings reset');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-20 sm:pb-8 space-y-8">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Playback */}
      <section className="bg-surface-100 rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <h2 className="text-white/70 text-sm font-medium">Playback</h2>
        </div>
        <div className="p-4 space-y-5">
          <div className="flex items-center justify-between">
            <label className="text-white/80 text-sm">Default Speed</label>
            <select
              value={settings.defaultPlaybackRate}
              onChange={e => update({ defaultPlaybackRate: parseFloat(e.target.value) })}
              className="bg-surface-200 border border-white/10 text-white text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {PLAYBACK_SPEEDS.map(s => (
                <option key={s} value={s}>{s === 1 ? 'Normal' : `${s}x`}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-white/80 text-sm">Default Volume</label>
            <div className="flex items-center gap-2">
              <input
                type="range" min={0} max={1} step={0.05}
                value={settings.defaultVolume}
                onChange={e => update({ defaultVolume: parseFloat(e.target.value) })}
                className="w-28 accent-accent"
              />
              <span className="text-white/60 text-xs w-8 text-right">{Math.round(settings.defaultVolume * 100)}%</span>
            </div>
          </div>

          <Toggle
            label="Auto-play next video"
            checked={settings.autoPlayNext}
            onChange={v => update({ autoPlayNext: v })}
          />
          <Toggle
            label="Resume playback position"
            checked={settings.resumePlayback}
            onChange={v => update({ resumePlayback: v })}
          />
          <Toggle
            label="Save watch history"
            checked={settings.saveHistory}
            onChange={v => update({ saveHistory: v })}
          />
          <Toggle
            label="Keyboard shortcuts"
            checked={settings.keyboardShortcutsEnabled}
            onChange={v => update({ keyboardShortcutsEnabled: v })}
          />
        </div>
      </section>

      {/* Subtitles */}
      <section className="bg-surface-100 rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <h2 className="text-white/70 text-sm font-medium">Subtitle Style</h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-white/80 text-sm">Font Size</label>
            <div className="flex items-center gap-2">
              <input
                type="range" min={0.7} max={2} step={0.1}
                value={settings.subtitleStyle.fontSize}
                onChange={e => update({ subtitleStyle: { ...settings.subtitleStyle, fontSize: parseFloat(e.target.value) } })}
                className="w-24 accent-accent"
              />
              <span className="text-white/60 text-xs w-10">{settings.subtitleStyle.fontSize}rem</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-white/80 text-sm">Text Color</label>
            <input
              type="color"
              value={settings.subtitleStyle.color}
              onChange={e => update({ subtitleStyle: { ...settings.subtitleStyle, color: e.target.value } })}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-white/80 text-sm">Background Opacity</label>
            <div className="flex items-center gap-2">
              <input
                type="range" min={0} max={1} step={0.05}
                value={settings.subtitleStyle.backgroundOpacity}
                onChange={e => update({ subtitleStyle: { ...settings.subtitleStyle, backgroundOpacity: parseFloat(e.target.value) } })}
                className="w-24 accent-accent"
              />
              <span className="text-white/60 text-xs w-8">{Math.round(settings.subtitleStyle.backgroundOpacity * 100)}%</span>
            </div>
          </div>
          <Toggle
            label="Text shadow"
            checked={settings.subtitleStyle.textShadow}
            onChange={v => update({ subtitleStyle: { ...settings.subtitleStyle, textShadow: v } })}
          />
        </div>
      </section>

      {/* Real-Debrid */}
      <section className="bg-surface-100 rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <h2 className="text-white/70 text-sm font-medium">Real-Debrid</h2>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-white/50 text-xs leading-relaxed">
            Your API token is stored in <code className="bg-black/40 px-1 rounded">server/.env</code> on the backend.
            It is never sent to or stored in the browser. To update it, edit the file and restart the server.
          </p>
          <button
            onClick={() => { clearUser(); toast.success('Real-Debrid session cleared'); }}
            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-sm transition-colors"
          >
            Clear local session
          </button>
        </div>
      </section>

      {/* Keyboard shortcuts */}
      <section className="bg-surface-100 rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <h2 className="text-white/70 text-sm font-medium">Keyboard Shortcuts</h2>
        </div>
        <div className="p-4">
          <table className="w-full text-sm">
            <tbody>
              {SHORTCUTS.map(s => (
                <tr key={s.keys} className="border-b border-white/5 last:border-0">
                  <td className="py-2 pr-4">
                    <code className="bg-surface-200 px-2 py-0.5 rounded text-xs text-white/80 font-mono">{s.keys}</code>
                  </td>
                  <td className="py-2 text-white/60 text-xs">{s.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-surface-100 rounded-xl border border-white/10 p-4">
        <h2 className="text-white/70 text-sm font-medium mb-2">Privacy</h2>
        <p className="text-white/40 text-xs leading-relaxed">
          All data (history, settings, queue) is stored locally in your browser's IndexedDB. Nothing is sent to external servers except requests to your own backend and, through it, to the official Real-Debrid API.
          No video files are cached locally.
        </p>
      </section>

      {/* Danger zone */}
      <div className="flex justify-end">
        <button onClick={handleReset} className="text-sm text-white/30 hover:text-white/60 transition-colors">
          Reset all settings to defaults
        </button>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/80 text-sm">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-white/20'}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'left-5' : 'left-1'}`} />
      </button>
    </div>
  );
}
