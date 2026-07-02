export default function Tapes() {
  return (
    <section id="tapesec">
      <div className="eyebrow rv">FILE 02 — RECOVERED MEDIA</div>
      <h2 className="rv d1">THE TAPES</h2>
      <p className="lede rv d2">In January 2022, a series of VHS recordings surfaced online — a cameraman falling
        through the floor of reality in 1996, and an institute that followed him in. The footage became a film.
        The film became a warning.</p>
      <div className="tapes">
        <article className="tape rv" data-n="VHS_001">
          <div className="tag">09.23.1996</div>
          <h3>The Fall</h3>
          <p>A filmmaker steps backward through a floor that was never there. Eleven minutes of footage. He is still walking.</p>
          <div className="bar"></div>
        </article>
        <article className="tape rv d1" data-n="VHS_004">
          <div className="tag">THE INSTITUTE</div>
          <h3>Async Research</h3>
          <p>A private foundation begins controlled entry through engineered thresholds. Their motto: informed by the future. They were not.</p>
          <div className="bar"></div>
        </article>
        <article className="tape rv d2" data-n="VHS_009">
          <div className="tag">STATUS: OPEN</div>
          <h3>Missing Persons</h3>
          <p>Nine confirmed entries. Zero confirmed returns. Audio from tape nine suggests at least one of them is no longer alone.</p>
          <div className="bar"></div>
        </article>
      </div>
    </section>
  );
}
