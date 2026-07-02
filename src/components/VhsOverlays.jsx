export default function VhsOverlays() {
  return (
    <>
      <div className="vhs-scan"></div>
      <div className="vhs-vig"></div>
      <canvas className="vhs-noise" id="noise"></canvas>
      <div className="vhs-flick" id="flick"></div>
      <div className="tracking-bar" id="track"></div>
      <div id="glitchveil"></div>
    </>
  );
}
