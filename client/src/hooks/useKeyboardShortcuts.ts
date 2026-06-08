import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { usePlayerStore } from '../stores/playerStore';

interface ShortcutHandlers {
  togglePlay: () => void;
  seekBy: (seconds: number) => void;
  adjustVolume: (delta: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  toggleTheater: () => void;
  togglePip: () => void;
  toggleCaptions: () => void;
  adjustSpeed: (delta: number) => void;
  seekToPercent: (pct: number) => void;
  frameStep: (forward: boolean) => void;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const { settings } = useSettingsStore();
  const { closeAllMenus } = usePlayerStore();

  useEffect(() => {
    if (!settings.keyboardShortcutsEnabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Don't fire on input elements
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          handlers.togglePlay();
          break;
        case 'KeyJ':
          e.preventDefault();
          handlers.seekBy(-10);
          break;
        case 'KeyL':
          e.preventDefault();
          handlers.seekBy(10);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlers.seekBy(e.shiftKey ? -30 : -5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handlers.seekBy(e.shiftKey ? 30 : 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handlers.adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handlers.adjustVolume(-0.1);
          break;
        case 'KeyM':
          e.preventDefault();
          handlers.toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          handlers.toggleFullscreen();
          break;
        case 'KeyT':
          e.preventDefault();
          handlers.toggleTheater();
          break;
        case 'KeyP':
          e.preventDefault();
          handlers.togglePip();
          break;
        case 'KeyC':
          e.preventDefault();
          handlers.toggleCaptions();
          break;
        case 'Period':
          if (e.shiftKey) { // >
            e.preventDefault();
            handlers.adjustSpeed(1);
          } else {
            e.preventDefault();
            handlers.frameStep(true);
          }
          break;
        case 'Comma':
          if (e.shiftKey) { // <
            e.preventDefault();
            handlers.adjustSpeed(-1);
          } else {
            e.preventDefault();
            handlers.frameStep(false);
          }
          break;
        case 'Digit0': case 'Numpad0': e.preventDefault(); handlers.seekToPercent(0); break;
        case 'Digit1': case 'Numpad1': e.preventDefault(); handlers.seekToPercent(10); break;
        case 'Digit2': case 'Numpad2': e.preventDefault(); handlers.seekToPercent(20); break;
        case 'Digit3': case 'Numpad3': e.preventDefault(); handlers.seekToPercent(30); break;
        case 'Digit4': case 'Numpad4': e.preventDefault(); handlers.seekToPercent(40); break;
        case 'Digit5': case 'Numpad5': e.preventDefault(); handlers.seekToPercent(50); break;
        case 'Digit6': case 'Numpad6': e.preventDefault(); handlers.seekToPercent(60); break;
        case 'Digit7': case 'Numpad7': e.preventDefault(); handlers.seekToPercent(70); break;
        case 'Digit8': case 'Numpad8': e.preventDefault(); handlers.seekToPercent(80); break;
        case 'Digit9': case 'Numpad9': e.preventDefault(); handlers.seekToPercent(90); break;
        case 'Escape':
          e.preventDefault();
          closeAllMenus();
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settings.keyboardShortcutsEnabled, handlers, closeAllMenus]);
}

export { PLAYBACK_SPEEDS };
