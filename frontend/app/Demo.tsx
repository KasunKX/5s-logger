"use client";

const references = [
  { image:"/references/shadow-board.jpg", label:"Visual tool control", source:"Creative Safety Supply", href:"https://www.creativesafetysupply.com/content/education-research/5S/index.html" },
  { image:"/references/tool-control.jpg", label:"A place for every tool", source:"Gemba Lean", href:"https://gemba-lean.com/taller-5s-organizacion-orden-y-limpieza/" },
  { image:"/references/before-after.png", label:"Before and after evidence", source:"AGITEC", href:"https://www.agitec.com/7-66/actualites/maximising-organisational-efficiency-implementing-the-5s-method/" },
  { image:"/references/floor-zones.jpg", label:"Defined floor locations", source:"Stop-Painting", href:"https://stop-painting.com/5s-lean-resources/" },
  { image:"/references/workstation-comparison.jpg", label:"Workstation improvement", source:"Ha Thuc Tien", href:"https://medium.com/@hathuctien/the-illusion-of-5s-5127ecd51912" },
  { image:"/references/workshop-before-after.jpg", label:"A visible transformation", source:"Flow in Motion", href:"https://www.flowinmotion.com/de-5s-valkuilen/" },
  { image:"/references/shadow-board-system.webp", label:"Standardized tool storage", source:"Monika Auto Components", href:"https://monikaautocomponents.in/portfolio" },
  { image:"/references/facility-marking.jpg", label:"Marked production zones", source:"Creative Safety Supply", href:"https://www.creativesafetysupply.com/industries/manufacturing/" },
  { image:"/references/cleaning-station.jpg", label:"Cleaning station standard", source:"TnP Visual Workplace", href:"https://www.visualworkplace.co.uk/discover-inspire/brabant-alucast" },
  { image:"/references/workbench-transformation.gif", label:"Organized workbench", source:"Viblo", href:"https://viblo.asia/p/5s-methodology-the-secret-to-japanese-success-3KbvZqw1GmWB" },
];

export function Demo(){
 return <main>
  <nav className="site-nav"><a className="brand" href="#overview"><span className="brand-mark"><i/><i/><i/><i/><i/></span>SiteSight</a><div className="nav-links"><a href="#detection">Detection</a><a href="#workflow">Workflow</a><a href="#references">References</a></div><a className="nav-action" href="/app">Try now <span>→</span></a></nav>

  <section className="screen hero" id="overview">
   <img className="hero-image" src="/hero-workplace-v2.png" alt="Industrial workshop with three precisely marked 5S opportunities"/>
   <div className="hero-shade"/>
   <div className="hero-content">
    <div className="kicker"><i/> Intelligent workplace review</div>
    <h1>Turn workplace footage into a <em>5S action log.</em></h1>
    <p>SiteSight detects visible 5S opportunities in workplace video and images, connects each finding to evidence, and gives improvement teams a clear record to review and act on.</p>
    <div className="hero-actions"><a href="/app">Try now <span>→</span></a><div><b>Evidence first</b><small>Every finding stays connected to the image that created it.</small></div></div>
   </div>
   <div className="hero-index"><span>01</span><b>Detect</b><i/><span>02</span><b>Review</b><i/><span>03</span><b>Log</b></div>
  </section>

  <section className="screen detection" id="detection">
   <div className="screen-head"><div><span>01 / Video and image analysis</span><h2>Upload workplace media.<br/>Get a detailed 5S log.</h2></div><div className="screen-explainer"><div className="source-types"><span>Video</span><span>Image sets</span></div><p>SiteSight reviews uploaded footage and images, selects clear evidence, identifies possible 5S conditions, and records each finding with its place in the video, importance and visual evidence.</p></div></div>
   <div className="evidence-wrap">
    <div className="evidence-image">
     <img src="/workshop-evidence-real-v5.png" alt="Detailed photographic tool wall with six 5S findings annotated directly around the matching physical evidence"/>
     <div className="frame-meta"><span>Workplace review · 01:00</span><span>Selected moment · 00:14</span></div>
    </div>
    <div className="finding-strip">
     <article><div className="finding-kind"><i/>Set in order</div><h3>Wrench placed in the wrong position</h3><p><b>00:14</b><span>·</span><em>High</em></p></article>
     <article><div className="finding-kind"><i/>Standardize</div><h3>Tool position has no visible label</h3><p><b>00:22</b><span>·</span><em>Medium</em></p></article>
     <article><div className="finding-kind"><i/>Shine</div><h3>Metal debris left on workbench</h3><p><b>00:41</b><span>·</span><em>Medium</em></p></article>
    </div>
   </div>
  </section>

  <section className="screen workflow" id="workflow">
   <div className="workflow-title"><span>02 / From video to action</span><h2>Purpose-built for a<br/><em>low-cost first pass.</em></h2><p>The future product selects useful moments economically and asks people—not software—to make the final operational decision.</p></div>
   <div className="workflow-body"><div className="steps">
    <article><b>01</b><div><h3>Sample</h3><p>Capture one useful moment every two seconds, then remove blur and duplicates.</p></div><span>Video → useful moments</span></article>
    <article><b>02</b><div><h3>Detect</h3><p>Find visible objects, labels, boundaries and unusual workplace conditions.</p></div><span>Moments → visible details</span></article>
    <article><b>03</b><div><h3>Interpret</h3><p>Match selected evidence with the applicable 5S rule and workplace context.</p></div><span>Details → findings</span></article>
    <article><b>04</b><div><h3>Review & log</h3><p>Confirm the evidence, priority, owner and corrective action.</p></div><span>Findings → action</span></article>
   </div><div className="five-s"><span>The review lens</span>{["Sort","Set in order","Shine","Standardize","Sustain"].map((x,i)=><div key={x}><b>0{i+1}</b><strong>{x}</strong></div>)}</div></div>
  </section>

  <section className="screen references" id="references">
   <div className="reference-head"><div><span>03 / Visual references</span><h2>Examples the system<br/>should learn to recognize.</h2></div><p>Real workplace references for clear locations, visible standards, clean conditions and evidence of improvement.</p></div>
   <div className="reference-grid">{references.map((r,i)=><a href={r.href} target="_blank" rel="noreferrer" key={r.source}><div className="thumb"><img src={r.image} alt={r.label}/><span>0{i+1}</span></div><h3>{r.label}</h3><p>Reference: {r.source} <span>↗</span></p></a>)}</div>
   <footer className="site-footer"><div className="footer-brand"><a className="brand inverse" href="#overview"><span className="brand-mark"><i/><i/><i/><i/><i/></span>SiteSight</a><span>Visual workplace intelligence</span></div><div className="footer-links"><a href="#detection">Detection</a><a href="#workflow">Workflow</a><a href="#references">References</a></div><div className="footer-meta"><span>Concept · 2026</span><a href="#overview">Back to top ↑</a></div></footer>
  </section>
 </main>
}
