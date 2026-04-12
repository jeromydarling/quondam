import { NavLink, Route, Routes } from "react-router-dom";
import Library from "./screens/Library";
import Tonight from "./screens/Tonight";
import Player from "./screens/Player";

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-night-800 bg-night-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-semibold tracking-wide">quondam</h1>
            <span className="text-xs text-cream-500">bedtime stories</span>
          </div>
          <nav className="flex gap-1">
            <TabLink to="/">Library</TabLink>
            <TabLink to="/tonight">Tonight</TabLink>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/tonight" element={<Tonight />} />
          <Route path="/play/:id" element={<Player />} />
        </Routes>
      </main>

      <footer className="text-center text-xs text-cream-500 py-4">
        Public-domain audio from archive.org & librivox.org
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
        `px-3 py-2 rounded-lg text-sm min-h-tap inline-flex items-center ${
          isActive
            ? "bg-night-700 text-cream-50"
            : "text-cream-300 hover:bg-night-800"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
