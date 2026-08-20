"use client";

const references = [
  { image:"/references/shadow-board.jpg", label:"Visual tool control", source:"Creative Safety Supply", href:"https://www.creativesafetysupply.com/content/education-research/5S/index.html" },
  { image:"/references/tool-control.jpg", label:"A place for every tool", source:"Gemba Lean", href:"https://gemba-lean.com/taller-5s-organizacion-orden-y-limpieza/" },
  { image:"/references/before-after.png", label:"Before and after evidence", source:"AGITEC", href:"https://www.agitec.com/7-66/actualites/maximising-organisational-efficiency-implementing-the-5s-method/" },
];

export function Demo(){
 return <main>
  <nav className="site-nav"><a className="brand" href="#overview"><span className="brand-mark"><i/><i/><i/><i/><i/></span>SiteSight</a><div className="nav-links"><a href="#detection">Detection</a><a href="#workflow">Workflow</a><a href="#references">References</a></div><a className="nav-action" href="#detection">View concept <span>↘</span></a></nav>

  <section className="screen hero" id="overview">
   <img className="hero-image" src="/hero-workplace-v2.png" alt="Industrial workshop with three precisely marked 5S opportunities"/>
   <div className="hero-shade"/>
   <div className="hero-content">
    <div className="kicker"><i/> AI-POWERED WORKPLACE REVIEW</div>
    <h1>Turn workplace footage into a <em>5S action log.</em></h1>
    <p>SiteSight detects visible 5S opportunities in workplace video and images, connects each finding to evidence, and gives improvement teams a clear record to review and act on.</p>
    <div className="hero-actions"><a href="#detection">See one inspection <span>↓</span></a><div><b>Evidence first</b><small>Every finding stays connected to the image that created it.</small></div></div>
   </div>
   <div className="hero-index"><span>01</span><b>Detect</b><i/><span>02</span><b>Review</b><i/><span>03</span><b>Log</b></div>
  </section>

  <section className="screen detection" id="detection">
   <div className="screen-head"><div><span>01 / VIDEO & IMAGE ANALYSIS</span><h2>Video in.<br/><em>5S evidence out.</em></h2></div><div className="screen-explainer"><div className="source-types"><span>VIDEO</span><span>IMAGE SETS</span></div><p>Upload workplace footage or a set of images. SiteSight samples the source, selects clear evidence frames, identifies possible 5S conditions, and logs each finding with its timestamp for review.</p></div></div>
   <div className="evidence-wrap">
    <div className="evidence-image"><img src="/workshop-analysis.png" alt="Evidence frame extracted from workplace video, showing cartons, an unlabeled bin and loose packaging"/><div className="e-label el1"><b>01</b><span>SET IN ORDER</span></div><div className="e-label el2"><b>02</b><span>STANDARDIZE</span></div><div className="e-label el3"><b>03</b><span>SHINE</span></div><div className="frame-meta"><span>SOURCE VIDEO · INSPECTION 042 · 01:00</span><span>EXTRACTED FRAME · 00:14</span></div></div>
    <div className="finding-strip">
     <article><b>01</b><div><span>SET IN ORDER</span><h3>Cartons cross the marked aisle</h3></div><small>00:14 · HIGH</small></article>
     <article><b>02</b><div><span>STANDARDIZE</span><h3>Storage bin has no visible label</h3></div><small>00:22 · MEDIUM</small></article>
     <article><b>03</b><div><span>SHINE</span><h3>Loose packaging below workbench</h3></div><small>00:41 · MEDIUM</small></article>
    </div>
   </div>
  </section>

  <section className="screen workflow" id="workflow">
   <div className="workflow-title"><span>02 / FROM VIDEO TO ACTION</span><h2>Purpose-built for a<br/><em>low-cost first pass.</em></h2><p>The future product uses economical frame sampling and asks people—not the model—to make the final operational decision.</p></div>
   <div className="workflow-body"><div className="steps">
    <article><b>01</b><div><h3>Sample</h3><p>Capture one useful frame every two seconds, then remove blur and duplicates.</p></div><span>VIDEO → FRAMES</span></article>
    <article><b>02</b><div><h3>Detect</h3><p>Find visible objects, labels, boundaries and unusual workplace conditions.</p></div><span>FRAMES → SIGNALS</span></article>
    <article><b>03</b><div><h3>Interpret</h3><p>Map selected evidence to the applicable 5S rule and site context.</p></div><span>SIGNALS → FINDINGS</span></article>
    <article><b>04</b><div><h3>Review & log</h3><p>Confirm the evidence, priority, owner and corrective action.</p></div><span>FINDINGS → ACTION</span></article>
   </div><div className="five-s"><span>THE REVIEW LENS</span>{["Sort","Set in order","Shine","Standardize","Sustain"].map((x,i)=><div key={x}><b>0{i+1}</b><strong>{x}</strong></div>)}</div></div>
  </section>

  <section className="screen references" id="references">
   <div className="reference-head"><div><span>03 / VISUAL REFERENCES</span><h2>Good 5S is<br/><em>easy to see.</em></h2></div><p>The product should recognize practical visual controls: clear locations, visible standards, clean conditions and evidence of improvement.</p></div>
   <div className="reference-grid">{references.map((r,i)=><a href={r.href} target="_blank" rel="noreferrer" key={r.source}><div className="thumb"><img src={r.image} alt={r.label}/><span>0{i+1}</span></div><h3>{r.label}</h3><p>Reference: {r.source} <span>↗</span></p></a>)}</div>
   <footer className="site-footer"><div className="footer-brand"><a className="brand inverse" href="#overview"><span className="brand-mark"><i/><i/><i/><i/><i/></span>SiteSight</a><span>Visual workplace intelligence</span></div><div className="footer-links"><a href="#detection">Detection</a><a href="#workflow">Workflow</a><a href="#references">References</a></div><div className="footer-meta"><span>CONCEPT · 2026</span><a href="#overview">Back to top ↑</a></div></footer>
  </section>
 </main>
}
