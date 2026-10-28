import {
  backgroundColor,
  type CharacterProfile,
  encodePng,
  normalizeSeed,
  PixatarError,
  profileFromSeed,
  randomSeed,
  renderAvatar,
  renderSheet,
  seedFromProfile,
  VENDOR,
} from 'pixatar';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

import { MOBILE_MEDIA_QUERY } from '../../../vendor/pixel-agents/webview-ui/src/constants.js';
import { CharactersView } from '../../../vendor/pixel-agents/webview-ui/src/characters/ui/CharactersView.js';
import { seedFromLocation, selectedProfile, startCast, startingSeed, useCast, wear } from './cast';
import { download } from './draw';
import { Animation, Avatar } from './Preview';

const start = startingSeed();
startCast(start.profile);

/** Whether `typed` stands for the character whose code is `code` (so the box can keep it). */
function makes(typed: string, code: string): boolean {
  try {
    return normalizeSeed(typed) === code;
  } catch {
    return false;
  }
}

function usePhone(): boolean {
  const [phone, setPhone] = useState(() => window.matchMedia(MOBILE_MEDIA_QUERY).matches);
  useEffect(() => {
    const query = window.matchMedia(MOBILE_MEDIA_QUERY);
    const onChange = () => setPhone(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return phone;
}

const AVATAR_SCALES = [1, 4, 8, 16] as const;

function Button(props: { onClick: () => void; children: React.ReactNode; title?: string; primary?: boolean }) {
  return (
    <button
      type="button"
      title={props.title}
      onClick={props.onClick}
      className={`px-12 py-4 border-2 border-border shadow-pixel cursor-pointer text-sm ${props.primary ? 'bg-accent hover:bg-accent-bright' : 'bg-btn-bg hover:bg-btn-hover'}`}
    >
      {props.children}
    </button>
  );
}

export function App() {
  const phone = usePhone();
  const cast = useCast();
  const profile = selectedProfile(cast);
  const [typed, setTyped] = useState(start.seed);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(true);
  const [avatarScale, setAvatarScale] = useState<(typeof AVATAR_SCALES)[number]>(8);

  const look = useMemo(() => {
    if (!profile) return null;
    try {
      const seed = seedFromProfile(profile);
      return { seed, profile: profileFromSeed(seed), background: backgroundColor(seed) };
    } catch {
      return null;
    }
  }, [profile]);
  const customItems = profile
    ? Object.values(profile).filter((v) => typeof v === 'string' && v.startsWith('custom_')).length
    : 0;

  // the character changed: the address follows, and so does the box unless it already says it
  useEffect(() => {
    if (!look) return;
    window.history.replaceState(null, '', `#${encodeURIComponent(look.seed)}`);
    setTyped((current) => (makes(current, look.seed) ? current : look.seed));
  }, [look]);

  // a seed pasted into the address bar
  useEffect(() => {
    const onHash = () => {
      const seed = seedFromLocation();
      if (seed && (!look || !makes(seed, look.seed))) apply(seed);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  });

  function apply(seed: string) {
    let next: CharacterProfile;
    try {
      next = profileFromSeed(seed);
    } catch (e) {
      setError(e instanceof PixatarError ? e.message : String(e));
      return;
    }
    setError(null);
    setTyped(seed);
    wear(next);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    apply(typed);
  }

  const name = (profile?.name || 'pixatar').replace(/[^\w.-]+/g, '-');

  return (
    <div className="min-h-full bg-bg-dark">
      <header className="flex flex-wrap items-baseline gap-x-16 gap-y-4 px-16 py-12 border-b-2 border-border bg-bg">
        <h1 className="m-0 text-2xl">pixatar</h1>
        <p className="m-0 text-sm text-text-muted">
          A seed makes a Pixel Agents character. The same seed, the same character, every time.
        </p>
      </header>

      <main className="flex flex-col gap-16 p-16 max-w-[1400px] mx-auto">
        <form onSubmit={onSubmit} className="flex flex-wrap gap-8 items-stretch">
          <label htmlFor="seed" className="sr-only">
            Seed
          </label>
          <input
            id="seed"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            placeholder="Type anything, or paste a px. seed code"
            className="flex-1 min-w-[240px] px-8 py-4 bg-bg border-2 border-border text-sm text-text"
          />
          <button type="submit" className="px-12 py-4 border-2 border-border shadow-pixel cursor-pointer text-sm bg-accent hover:bg-accent-bright">
            Make
          </button>
          <Button onClick={() => apply(randomSeed())} title="A new random character">
            Random
          </Button>
        </form>
        {error && <p className="m-0 text-sm text-danger" role="alert">{error}</p>}

        {look && (
          <section className="flex flex-wrap gap-24 items-start">
            <div className="flex flex-col gap-8">
              <Avatar profile={look.profile} background={look.background} />
              <span className="text-xs text-text-muted">Background {look.background}</span>
            </div>
            <Animation profile={look.profile} background={look.background} />
            <div className="flex flex-col gap-8 min-w-0 flex-1 basis-[280px]">
              <span className="text-sm text-text-muted">Seed code: give it back for this exact character</span>
              <code className="block p-8 bg-bg border-2 border-border text-xs break-all select-all">{look.seed}</code>
              {customItems > 0 && (
                <p className="m-0 text-xs text-warning">
                  This character wears a custom item. Its seed names the item but can’t carry its art.
                </p>
              )}
              <div className="flex flex-wrap gap-8">
                <Button onClick={() => void navigator.clipboard.writeText(look.seed)}>Copy seed</Button>
                <Button onClick={() => void navigator.clipboard.writeText(window.location.href)}>Copy link</Button>
              </div>
              <div className="flex flex-wrap gap-8 items-center">
                <Button
                  onClick={() =>
                    download(`${name}-avatar.png`, encodePng(renderAvatar(look.profile, { scale: avatarScale, background: look.background })), 'image/png')
                  }
                >
                  Avatar PNG
                </Button>
                <select
                  aria-label="Avatar size"
                  value={avatarScale}
                  onChange={(e) => setAvatarScale(Number(e.target.value) as (typeof AVATAR_SCALES)[number])}
                  className="px-4 py-4 bg-btn-bg border-2 border-border text-sm text-text"
                >
                  {AVATAR_SCALES.map((s) => (
                    <option key={s} value={s}>
                      {20 * s}px
                    </option>
                  ))}
                </select>
                <Button onClick={() => download(`${name}-sheet.png`, encodePng(renderSheet(look.profile)), 'image/png')}>
                  Sprite sheet PNG
                </Button>
                <Button
                  title="A Pixel Agents character config: its Characters view loads it with Load config"
                  onClick={() =>
                    download(`${name}.json`, `${JSON.stringify({ name: profile?.name || 'Pixatar', ...look.profile }, null, 2)}\n`, 'application/json')
                  }
                >
                  Profile JSON
                </Button>
              </div>
            </div>
          </section>
        )}

        <section className="flex flex-col gap-8">
          <div className="flex items-center gap-12">
            <h2 className="m-0 text-lg">Customize</h2>
            <span className="text-xs text-text-muted">Pixel Agents’ own Characters view. Every change makes a new seed.</span>
            <span className="flex-1" />
            <Button onClick={() => setEditing((e) => !e)}>{editing ? 'Hide' : 'Show'}</Button>
          </div>
          {editing && (
            <div className="pixatar-editor relative h-[820px] max-h-[92dvh] border-2 border-border overflow-hidden">
              <CharactersView phone={phone} onClose={() => setEditing(false)} />
            </div>
          )}
        </section>
      </main>

      <footer className="px-16 py-12 text-xs text-text-muted border-t-2 border-border">
        Characters, wardrobe and renderer from{' '}
        <a className="text-accent-bright" href="https://github.com/pixel-agents-hq/pixel-agents">
          Pixel Agents
        </a>{' '}
        {VENDOR.version} ({VENDOR.commit.slice(0, 7)}), MIT. Character art based on JIK-A-4’s Metro City pack.
      </footer>
    </div>
  );
}
