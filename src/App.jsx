import { useState } from "react";
import { useBackroomsEngine } from "./hooks/useBackroomsEngine.js";
import GameMenu from "./components/GameMenu.jsx";
import VhsOverlays from "./components/VhsOverlays.jsx";
import WrongLevel from "./components/WrongLevel.jsx";
import GameHud from "./components/GameHud.jsx";
import GameEnd from "./components/GameEnd.jsx";
import Cursor from "./components/Cursor.jsx";
import Loader from "./components/Loader.jsx";
import Chrome from "./components/Chrome.jsx";
import Hero from "./components/content/Hero.jsx";
import Level0 from "./components/content/Level0.jsx";
import Tapes from "./components/content/Tapes.jsx";
import Entity from "./components/content/Entity.jsx";
import Noclip from "./components/content/Noclip.jsx";
import PlaySec from "./components/content/PlaySec.jsx";
import Footer from "./components/content/Footer.jsx";

export default function App() {
  useBackroomsEngine();
  const [menuOpen, setMenuOpen] = useState(false);

  // The "ENTER THE MAZE" button opens this menu instead of starting directly.
  // Menu PLAY closes it and tells the engine to start via a custom event.
  const startGame = () => {
    setMenuOpen(false);
    dispatchEvent(new CustomEvent("backrooms:start"));
  };

  // Order mirrors the original backrooms.html body so z-index / stacking is
  // preserved. All behavior is wired by the engine via element ids — the
  // components are static markup only.
  return (
    <>
      <canvas id="scene"></canvas>

      <VhsOverlays />
      <WrongLevel />
      <GameHud />
      <GameEnd />
      <Cursor />
      <Loader />
      <Chrome />

      <main>
        <Hero />
        <Level0 />
        <Tapes />
        <Entity />
        <Noclip />
        <PlaySec onEnter={() => setMenuOpen(true)} />
      </main>

      <Footer />

      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} onPlay={startGame} />
    </>
  );
}
