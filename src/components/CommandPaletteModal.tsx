import { useEffect, useMemo, useRef, useState } from 'react';
import { tactileAudio } from '../engines/tactileAudio';

export interface CommandItem {
  id: string;
  code: string;
  group: string;
  label: string;
  hint: string;
  onSelect: () => void;
}

interface CommandPaletteModalProps {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
  lang: 'en' | 'vi';
}

export function CommandPaletteModal({
  open,
  onClose,
  items,
  lang,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        it.group.toLowerCase().includes(q) ||
        it.hint.toLowerCase().includes(q) ||
        it.code.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        onClose();
      } else if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        setActiveIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
        tactileAudio.playTick(1320);
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        setActiveIndex((prev) =>
          filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0
        );
        tactileAudio.playTick(1180);
      } else if (ev.key === 'Enter' && filtered[activeIndex]) {
        ev.preventDefault();
        tactileAudio.playLatch();
        filtered[activeIndex].onSelect();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, filtered, onClose, open]);

  if (!open) return null;

  return (
    <div
      data-testid="command-palette-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-start justify-center pt-[11vh] px-4"
    >
      <div
        data-testid="command-palette-dialog"
        onClick={(e) => e.stopPropagation()}
        className="liquid-glass w-full max-w-2xl rounded-2xl overflow-hidden"
      >
        {/* Search Input Header */}
        <div className="flex items-center px-4 py-3.5 hairline-b gap-3">
          <span
            style={{ color: 'var(--accent)' }}
            className="font-mono-tech text-xs font-bold shrink-0"
          >
            [CMD // K]
          </span>
          <input
            ref={inputRef}
            data-testid="command-palette-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              lang === 'vi'
                ? 'Nhập lệnh: chuyển giao diện, kích hoạt Raft failover, tải CV, mở AegisPulse...'
                : 'Type a command: switch theme, trigger Raft failover, download CV, jump to lab...'
            }
            className="w-full bg-transparent text-sm text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)] focus:outline-none font-mono-tech"
          />
          <button
            type="button"
            onClick={onClose}
            className="font-mono-tech text-[10px] px-2 py-1 hairline-box text-[var(--fg-muted)] hover:text-[var(--fg-primary)] cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Filtered Action Rows */}
        <div className="max-h-[54vh] overflow-y-auto divide-y divide-[var(--hairline)]">
          {filtered.length === 0 ? (
            <div className="px-5 py-8 text-center font-mono-tech text-xs text-[var(--fg-muted)]">
              NO MATCHING ARCHITECTURAL COMMANDS FOUND
            </div>
          ) : (
            filtered.map((item, idx) => {
              const selected = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    tactileAudio.playLatch();
                    item.onSelect();
                    onClose();
                  }}
                  style={{
                    backgroundColor: selected ? 'var(--accent-soft)' : 'transparent',
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between gap-4 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      style={{ color: selected ? 'var(--accent)' : 'var(--fg-muted)' }}
                      className="font-mono-tech text-[11px] font-semibold shrink-0"
                    >
                      [{item.code}]
                    </span>
                    <div className="truncate">
                      <span className="text-sm font-medium text-[var(--fg-primary)] block truncate">
                        {item.label}
                      </span>
                      <span className="font-mono-tech text-[10px] text-[var(--fg-muted)] uppercase">
                        {item.group}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono-tech text-[10px] text-[var(--fg-secondary)] shrink-0">
                    {item.hint}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Keyboard Legend */}
        <div className="px-4 py-2.5 hairline-t bg-[var(--bg-elevated)] flex items-center justify-between font-mono-tech text-[10px] text-[var(--fg-muted)]">
          <span>UP / DOWN TO NAVIGATE · ENTER TO EXECUTE</span>
          <span>TRUONG VAN TINH // ATELIER OS v4.0</span>
        </div>
      </div>
    </div>
  );
}
