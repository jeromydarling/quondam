import { NavLink, Route, Routes } from "react-router-dom";
import Library from "./screens/Library";
import Tonight from "./screens/Tonight";
import Player from "./screens/Player";

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-ink-800 bg-ink-900/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <h1
              className="font-serif text-3xl text-cream-50"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80, "wght" 500' }}
            >
              quondam
            </h1>
            <span className="label-eyebrow hidden sm:inline">bedtime stories</span>
          </div>
          <nav className="flex gap-1">
            <TabLink to="/">Library</TabLink>
            <TabLink to="/tonight">Tonight</TabLink>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-5 py-8">
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/tonight" element={<Tonight />} />
          <Route path="/play/:id" element={<Player />} />
        </Routes>
      </main>

      <footer className="text-center py-8">
        <a
          href="https://myschola.app"
          target="_blank"
          rel="noreferrer"
          className="font-serif text-sm text-cream-300 italic hover:text-amber transition-colors"
          style={{ fontVariationSettings: '"opsz" 14, "SOFT" 50, "wght" 400' }}
        >
          Brought to you by <span className="not-italic font-medium">CROS Schola</span>
        </a>
      </footer>
    </div>
  );
}

function TabLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `px-4 py-2 rounded-lg text-sm min-h-tap inline-flex items-center font-sans tracking-wide ${
          isActive
            ? "bg-ink-800 text-cream-50"
            : "text-cream-300 hover:bg-ink-850"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
