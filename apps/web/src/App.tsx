import {
  type AvatarBackground,
  backgroundColor,
  encodePng,
  PixatarError,
  randomSeed,
  renderAvatar,
  renderSheet,
  seedFromProfile,
  VENDOR,
} from 'pixatar';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

import { MOBILE_MEDIA_QUERY } from '../../../vendor/pixel-agents/webview-ui/src/constants.js';
import { CharactersView } from '../../../vendor/pixel-agents/webview-ui/src/characters/ui/CharactersView.js';
import {
  hashOf,
  readSeed,
  type SeedKind,
  seedFromLocation,
  selectedProfile,
  startCast,
  startingSeed,
  type TypedSeed,
  useCast,
  wear,
} from './cast';
import { download } from './draw';
import { Animation, Avatar } from './Preview';

const start = startingSeed();
startCast(start.profile);

/** The seed code `typed` makes with the toggle at `background`, or null when it makes none. */
function codeOf(typed: TypedSeed, background: AvatarBackground): string | null {
  try {
    const read = readSeed(typed);
    return seedFromProfile(read.profile, { background: typed.kind === 'code' ? read.background! : background });
  } catch {
    return null;
  }
}

/** Whether `typed` stands for the character whose code is `code` (so the box can keep it). */
const makes = (typed: TypedSeed, code: string, background: AvatarBackground): boolean =>
  codeOf(typed, background) === code;

const PLACEHOLDERS: Record<SeedKind, string> = {
  text: 'Type anything: the same text, the same character',
  code: 'Paste a px. seed code',
};

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
  const [kind, setKind] = useState<SeedKind>(start.kind);
  const [typed, setTyped] = useState(start.value);
  const [avatarBackground, setAvatarBackground] = useState<AvatarBackground>(start.background);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(true);
  const [avatarScale, setAvatarScale] = useState<(typeof AVATAR_SCALES)[number]>(8);

  const look = useMemo(() => {
    if (!profile) return null;
    try {
      const seed = seedFromProfile(profile, { background: avatarBackground });
      const read = readSeed({ kind: 'code', value: seed });
      return { seed, profile: read.profile, background: backgroundColor(seed), transparent: avatarBackground === 'transparent' };
    } catch {
      return null;
    }
  }, [profile, avatarBackground]);
  // the seed code the box would make, shown as it is typed
  const preview = kind === 'text' ? codeOf({ kind, value: typed }, avatarBackground) : null;
  const customItems = profile
    ? Object.values(profile).filter((v) => typeof v === 'string' && v.startsWith('custom_')).length
    : 0;

  // the character changed: the address follows (#t.<text> while the box's text makes it, else
  // the code), and so does the box unless it already says it (it then shows the code)
  useEffect(() => {
    if (!look) return;
    const current = { kind, value: typed };
    const keep = makes(current, look.seed, avatarBackground);
    window.history.replaceState(null, '', keep && kind === 'text' && avatarBackground === 'color' ? hashOf(current) : hashOf({ kind: 'code', value: look.seed }));
    if (!keep) {
      setKind('code');
      setTyped(look.seed);
    }
  }, [look]);

  // a seed pasted into the address bar
  useEffect(() => {
    const onHash = () => {
      const seed = seedFromLocation();
      if (seed && (!look || !makes(seed, look.seed, avatarBackground))) apply(seed);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  });

  function apply(seed: TypedSeed) {
    let read: ReturnType<typeof readSeed>;
    try {
      read = readSeed(seed);
    } catch (e) {
      setError(e instanceof PixatarError ? e.message : String(e));
      return;
    }
    setError(null);
    setKind(seed.kind);
    setTyped(seed.value);
    if (read.background) setAvatarBackground(read.background);
    wear(read.profile);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    apply({ kind, value: typed });
  }

  function switchKind(next: SeedKind) {
    if (next === kind) return;
    setError(null);
    setKind(next);
    // a code to paste over, or a fresh text to type
    setTyped(next === 'code' && look ? look.seed : '');
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
          <div className="flex" role="group" aria-label="Seed kind">
            {(['text', 'code'] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={k === kind}
                onClick={() => switchKind(k)}
                title={k === 'text' ? 'Free text: any string, hashed into a character' : 'A px. seed code: the character itself, exactly'}
                className={`px-10 py-4 border-2 border-border text-sm cursor-pointer ${k === kind ? 'bg-active-bg' : 'bg-btn-bg hover:bg-btn-hover'}`}
              >
                {k === 'text' ? 'Text' : 'Seed code'}
              </button>
            ))}
          </div>
          <label htmlFor="seed" className="sr-only">
            {kind === 'text' ? 'Free-text seed' : 'Seed code'}
          </label>
          <input
            id="seed"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            placeholder={PLACEHOLDERS[kind]}
            className="flex-1 min-w-[240px] px-8 py-4 bg-bg border-2 border-border text-sm text-text"
          />
          <button type="submit" className="px-12 py-4 border-2 border-border shadow-pixel cursor-pointer text-sm bg-accent hover:bg-accent-bright">
            Make
          </button>
          <Button onClick={() => apply({ kind: 'code', value: randomSeed({ background: avatarBackground }) })} title="A new random character">
            Random
          </Button>
        </form>
        {preview && preview !== look?.seed && (
          <p className="m-0 text-xs text-text-muted break-all">
            Makes <code>{preview}</code> (press Make)
          </p>
        )}
        {error && <p className="m-0 text-sm text-danger" role="alert">{error}</p>}

        {look && (
          <section className="flex flex-wrap gap-24 items-start">
            <div className="flex flex-col gap-8">
              <Avatar profile={look.profile} background={look.transparent ? null : look.background} />
              <span className="text-xs text-text-muted">Background {look.transparent ? 'transparent' : look.background}</span>
            </div>
            <Animation profile={look.profile} background={look.background} />
            <div className="flex flex-col gap-8 min-w-0 flex-1 basis-[280px]">
              <span className="text-sm text-text-muted">
                {kind === 'text' && makes({ kind, value: typed }, look.seed, avatarBackground)
                  ? 'Seed code your text makes: give it back for this exact character'
                  : 'Seed code: give it back for this exact character'}
              </span>
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
                    download(
                      `${name}-avatar.png`,
                      encodePng(renderAvatar(look.profile, { scale: avatarScale, background: look.transparent ? null : look.background })),
                      'image/png',
                    )
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
                <label className="flex items-center gap-4 text-sm" title="Saved in the seed code. The sprite sheet is always transparent.">
                  <input
                    type="checkbox"
                    checked={look.transparent}
                    onChange={(e) => setAvatarBackground(e.target.checked ? 'transparent' : 'color')}
                  />
                  Transparent avatar
                </label>
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
