/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop - Landing page
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client';

export default function HomePage() {
  return (
    <>
      <div className="pd-body">
        <div className="page-stitch" />

        {/* NAV */}
        <nav className="pd-nav">
          <div className="pd-brand">
            {/* Double-ring mini logo — updated design */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="28" height="28" fill="none">
              <defs>
                <clipPath id="nav-dots"><circle cx="100" cy="100" r="67"/></clipPath>
              </defs>
              <circle cx="100" cy="100" r="94"   fill="none" stroke="#C48540" strokeWidth="10"/>
              <circle cx="100" cy="100" r="80.5" fill="rgba(28,59,107,0.92)" stroke="#C48540" strokeWidth="6"/>
              <g clipPath="url(#nav-dots)">
                <circle cx="44"  cy="158" r="8" fill="#C48540" opacity="0.85"/>
                <circle cx="70"  cy="164" r="8" fill="#D4A853" opacity="0.85"/>
                <circle cx="100" cy="166" r="8" fill="#C48540" opacity="0.85"/>
                <circle cx="130" cy="164" r="8" fill="#D4A853" opacity="0.85"/>
                <circle cx="156" cy="158" r="8" fill="#C48540" opacity="0.85"/>
                <circle cx="36"  cy="138" r="7" fill="#C48540" opacity="0.55"/>
                <circle cx="164" cy="138" r="7" fill="#D4A853" opacity="0.55"/>
                <circle cx="30"  cy="115" r="6" fill="#C48540" opacity="0.28"/>
                <circle cx="170" cy="115" r="6" fill="#D4A853" opacity="0.28"/>
              </g>
              <rect x="60" y="40" width="80" height="26" rx="14"
                fill="#D4A853" fillOpacity="0.14" stroke="#D4A853" strokeWidth="7"/>
              <line x1="76"  y1="66" x2="76"  y2="84" stroke="#D4A853" strokeWidth="11" strokeLinecap="round"/>
              <line x1="124" y1="66" x2="124" y2="84" stroke="#D4A853" strokeWidth="11" strokeLinecap="round"/>
              <line x1="100" y1="92" x2="100" y2="100" stroke="#C48540" strokeWidth="7" strokeDasharray="12,10" opacity="0.85"/>
              <rect x="54" y="108" width="92" height="36" rx="20"
                fill="rgba(196,133,58,0.08)" stroke="#C48540" strokeWidth="7"/>
              <rect x="66"  y="116" width="18" height="20" rx="10" fill="#C48540" opacity="0.92"/>
              <rect x="116" y="116" width="18" height="20" rx="10" fill="#C48540" opacity="0.92"/>
              <circle cx="100" cy="100" r="80.5" fill="none" stroke="#C48540" strokeWidth="6"/>
            </svg>
            <span className="pd-brand-name">PortDrop</span>
          </div>
          <div className="pd-nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#docs">Docs</a>
            <a href="#changelog">Changelog</a>
          </div>
          <button className="pd-nav-cta" onClick={() => window.open('https://marketplace.visualstudio.com/items?itemName=codebreeder.portdrop','_blank')}>Install →</button>
        </nav>

        {/* HERO */}
        <section className="pd-hero">
          <div className="pd-patch" style={{top:'60px',right:'80px',width:'120px',height:'120px',transform:'rotate(6deg)'}}/>
          <div className="pd-patch" style={{bottom:'80px',left:'40px',width:'90px',height:'90px',transform:'rotate(-8deg)'}}/>
          <div className="pd-patch" style={{top:'200px',left:'55%',width:'60px',height:'60px',transform:'rotate(15deg)',opacity:'0.6'}}/>

          {/* LEFT: copy */}
          <div className="pd-copy">
            <div className="pd-eyebrow">
              <span className="pd-pulse"/>
              VS Code Extension · v0.1
            </div>
            <h1 className="pd-h1">
              You control<br/>
              the <span className="accent">window.</span>
            </h1>
            <p className="pd-lede">
              <strong>PortDrop</strong> lets you wire up local dev ports the way you wire up
              a workshop — drop the plug, pick the outlet, and ship. No more juggling
              <em> localhost:</em> tabs or hunting through terminal scrollback.
            </p>
            <div className="pd-cta-row">
              <button className="pd-btn-primary" onClick={() => window.open('https://marketplace.visualstudio.com/items?itemName=codebreeder.portdrop','_blank')}>
                Get the Extension
                <span style={{fontSize:'16px',lineHeight:'1'}}>→</span>
              </button>
              <button className="pd-btn-secondary" onClick={() => window.open('https://github.com/Frandycode/portdrop','_blank')}>View on GitHub</button>
            </div>
            <div className="pd-tag-strip">
              <span className="pd-tag"><span className="pd-tag-dot"/>Free &amp; Open Source</span>
              <span className="pd-tag-sep">·</span>
              <span className="pd-tag"><span className="pd-tag-dot"/>VS Code 1.89+</span>
              <span className="pd-tag-sep">·</span>
              <span className="pd-tag"><span className="pd-tag-dot"/>Cross-platform</span>
            </div>
          </div>

          {/* RIGHT: hero logo */}
          <div className="pd-stage">
            <div className="pd-stage-frame">
              <svg className="pd-logo-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
                <defs>
                  <clipPath id="hero-inner-clip">
                    <circle cx="90" cy="90" r="62"/>
                  </clipPath>
                  <linearGradient id="hero-dot-fade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#000"/>
                    <stop offset="35%"  stopColor="#000"/>
                    <stop offset="65%"  stopColor="#666"/>
                    <stop offset="92%"  stopColor="#fff"/>
                    <stop offset="100%" stopColor="#fff"/>
                  </linearGradient>
                  <mask id="hero-dot-mask" maskUnits="userSpaceOnUse" x="28" y="28" width="124" height="124">
                    <rect x="28" y="28" width="124" height="124" fill="url(#hero-dot-fade)"/>
                  </mask>
                </defs>

                {/* Outer ring — thicker */}
                <circle cx="90" cy="90" r="82" fill="none" stroke="#C48540" strokeWidth="2.5"/>
                {/* Inner ring — thinner, 12px gap from outer */}
                <circle cx="90" cy="90" r="68" fill="rgba(28,59,107,0.92)" stroke="#C48540" strokeWidth="1.5"/>

                {/* Dot field — clipped to inner ring, faded upward via mask */}
                <g clipPath="url(#hero-inner-clip)" mask="url(#hero-dot-mask)">
                  <circle cx="44"  cy="148" r="2.4" fill="#C48540" opacity="0.85"/>
                  <circle cx="56"  cy="150" r="2.6" fill="#C48540" opacity="0.85"/>
                  <circle cx="68"  cy="151" r="2.5" fill="#D4A853" opacity="0.85"/>
                  <circle cx="80"  cy="152" r="2.6" fill="#C48540" opacity="0.85"/>
                  <circle cx="92"  cy="152" r="2.6" fill="#D4A853" opacity="0.85"/>
                  <circle cx="104" cy="151" r="2.5" fill="#C48540" opacity="0.85"/>
                  <circle cx="116" cy="150" r="2.6" fill="#D4A853" opacity="0.85"/>
                  <circle cx="128" cy="148" r="2.4" fill="#C48540" opacity="0.85"/>
                  <circle cx="138" cy="145" r="2.2" fill="#C48540" opacity="0.80"/>
                  <circle cx="42"  cy="145" r="2.2" fill="#C48540" opacity="0.80"/>
                  <circle cx="50"  cy="140" r="2.4" fill="#D4A853" opacity="0.80"/>
                  <circle cx="62"  cy="141" r="2.3" fill="#C48540" opacity="0.80"/>
                  <circle cx="74"  cy="142" r="2.5" fill="#D4A853" opacity="0.85"/>
                  <circle cx="86"  cy="143" r="2.4" fill="#C48540" opacity="0.85"/>
                  <circle cx="98"  cy="143" r="2.5" fill="#D4A853" opacity="0.85"/>
                  <circle cx="110" cy="142" r="2.4" fill="#C48540" opacity="0.80"/>
                  <circle cx="122" cy="141" r="2.3" fill="#D4A853" opacity="0.80"/>
                  <circle cx="134" cy="139" r="2.2" fill="#C48540" opacity="0.75"/>
                  <circle cx="46"  cy="132" r="2.1" fill="#C48540" opacity="0.70"/>
                  <circle cx="58"  cy="133" r="2.3" fill="#D4A853" opacity="0.75"/>
                  <circle cx="70"  cy="134" r="2.2" fill="#C48540" opacity="0.75"/>
                  <circle cx="82"  cy="134" r="2.4" fill="#D4A853" opacity="0.80"/>
                  <circle cx="94"  cy="134" r="2.3" fill="#C48540" opacity="0.75"/>
                  <circle cx="106" cy="134" r="2.2" fill="#D4A853" opacity="0.75"/>
                  <circle cx="118" cy="133" r="2.3" fill="#C48540" opacity="0.75"/>
                  <circle cx="130" cy="131" r="2.1" fill="#D4A853" opacity="0.70"/>
                  <circle cx="40"  cy="124" r="1.8" fill="#C48540" opacity="0.55"/>
                  <circle cx="52"  cy="124" r="2.0" fill="#D4A853" opacity="0.65"/>
                  <circle cx="64"  cy="125" r="2.1" fill="#C48540" opacity="0.70"/>
                  <circle cx="76"  cy="125" r="2.0" fill="#D4A853" opacity="0.70"/>
                  <circle cx="88"  cy="125" r="2.2" fill="#C48540" opacity="0.70"/>
                  <circle cx="100" cy="125" r="2.1" fill="#D4A853" opacity="0.70"/>
                  <circle cx="112" cy="125" r="2.0" fill="#C48540" opacity="0.65"/>
                  <circle cx="124" cy="124" r="2.0" fill="#D4A853" opacity="0.65"/>
                  <circle cx="136" cy="123" r="1.8" fill="#C48540" opacity="0.55"/>
                  <circle cx="46"  cy="115" r="1.7" fill="#D4A853" opacity="0.50"/>
                  <circle cx="58"  cy="115" r="1.9" fill="#C48540" opacity="0.55"/>
                  <circle cx="70"  cy="116" r="1.8" fill="#D4A853" opacity="0.60"/>
                  <circle cx="82"  cy="116" r="1.9" fill="#C48540" opacity="0.60"/>
                  <circle cx="94"  cy="116" r="1.9" fill="#D4A853" opacity="0.60"/>
                  <circle cx="106" cy="116" r="1.8" fill="#C48540" opacity="0.55"/>
                  <circle cx="118" cy="115" r="1.9" fill="#D4A853" opacity="0.55"/>
                  <circle cx="130" cy="114" r="1.7" fill="#C48540" opacity="0.50"/>
                  <circle cx="52"  cy="106" r="1.6" fill="#C48540" opacity="0.45"/>
                  <circle cx="64"  cy="107" r="1.7" fill="#D4A853" opacity="0.50"/>
                  <circle cx="76"  cy="107" r="1.6" fill="#C48540" opacity="0.50"/>
                  <circle cx="88"  cy="107" r="1.7" fill="#D4A853" opacity="0.50"/>
                  <circle cx="100" cy="107" r="1.7" fill="#C48540" opacity="0.50"/>
                  <circle cx="112" cy="107" r="1.6" fill="#D4A853" opacity="0.45"/>
                  <circle cx="124" cy="106" r="1.6" fill="#C48540" opacity="0.45"/>
                  <circle cx="48"  cy="98"  r="1.4" fill="#D4A853" opacity="0.35"/>
                  <circle cx="62"  cy="98"  r="1.5" fill="#C48540" opacity="0.40"/>
                  <circle cx="74"  cy="99"  r="1.5" fill="#D4A853" opacity="0.40"/>
                  <circle cx="118" cy="98"  r="1.5" fill="#C48540" opacity="0.40"/>
                  <circle cx="132" cy="98"  r="1.4" fill="#D4A853" opacity="0.35"/>
                  <circle cx="44"  cy="89"  r="1.3" fill="#C48540" opacity="0.30"/>
                  <circle cx="58"  cy="89"  r="1.4" fill="#D4A853" opacity="0.30"/>
                  <circle cx="124" cy="89"  r="1.4" fill="#C48540" opacity="0.30"/>
                  <circle cx="138" cy="89"  r="1.3" fill="#D4A853" opacity="0.30"/>
                  <circle cx="50"  cy="80"  r="1.2" fill="#C48540" opacity="0.25"/>
                  <circle cx="130" cy="80"  r="1.2" fill="#D4A853" opacity="0.25"/>
                  <circle cx="42"  cy="71"  r="1.0" fill="#C48540" opacity="0.20"/>
                  <circle cx="138" cy="71"  r="1.0" fill="#D4A853" opacity="0.20"/>
                </g>

                {/* Plug head — 12px from inner ring top */}
                <rect x="72" y="44" width="36" height="26" rx="4"
                  fill="#D4A853" fillOpacity="0.14" stroke="#D4A853" strokeWidth="1.8"/>
                {/* Prongs */}
                <line x1="81" y1="70" x2="81" y2="82" stroke="#D4A853" strokeWidth="2.6" strokeLinecap="round"/>
                <line x1="99" y1="70" x2="99"  y2="82" stroke="#D4A853" strokeWidth="2.6" strokeLinecap="round"/>
                {/* Connector */}
                <line x1="90" y1="90" x2="90" y2="98"
                  stroke="#C48540" strokeWidth="1.8"
                  strokeDasharray="2.5,2.5" opacity="0.85"/>
                {/* Socket — 12px from inner ring bottom */}
                <rect x="67" y="106" width="46" height="30" rx="5"
                  fill="rgba(196,133,58,0.08)" stroke="#C48540" strokeWidth="1.8"/>
                <rect x="75" y="112" width="12" height="16" rx="2.5" fill="#C48540" opacity="0.92"/>
                <rect x="93" y="112" width="12" height="16" rx="2.5" fill="#C48540" opacity="0.92"/>

                {/* Rivet dots on outer ring */}
                <circle cx="90"  cy="8"   r="3.5" fill="#C48540" opacity="0.75"/>
                <circle cx="172" cy="90"  r="3.5" fill="#C48540" opacity="0.75"/>
                <circle cx="90"  cy="172" r="3.5" fill="#C48540" opacity="0.75"/>
                <circle cx="8"   cy="90"  r="3.5" fill="#C48540" opacity="0.75"/>
              </svg>
              <div className="pd-stage-spec">double ring · denim weave · v0.1</div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="pd-footer">
          <div>© 2026 · PortDrop</div>
          <div className="pd-footer-by">
            <span style={{opacity:'0.5'}}>crafted by</span>
            <span style={{color:'#D4A853'}}>CodeBreeder</span>
          </div>
        </footer>
      </div>
    </>
  );
}
