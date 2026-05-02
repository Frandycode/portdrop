/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Project  : PortDrop — Landing page
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PortDrop — You control the window.',
  description: 'Share your running local app via QR code. You control the window. You control the clock.',
};

export default function HomePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fjalla+One&family=JetBrains+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap');

        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%}

        .pd-body{
          font-family:'Outfit',sans-serif;
          color:#D4A853;
          background-color:#142a4f;
          background-image:
            repeating-linear-gradient(135deg,
              rgba(255,255,255,0.028) 0px,
              rgba(255,255,255,0.028) 1px,
              transparent 1px,
              transparent 5px),
            repeating-linear-gradient(45deg,
              rgba(0,0,0,0.12) 0px,
              rgba(0,0,0,0.12) 1px,
              transparent 1px,
              transparent 5px),
            radial-gradient(ellipse at 50% 40%,
              #1f447a 0%,
              #142a4f 55%,
              #0c1d3a 100%);
          min-height:100vh;
          overflow-x:hidden;
        }

        .page-stitch{
          position:fixed;inset:14px;
          border:2px dashed rgba(196,133,58,0.32);
          border-radius:10px;pointer-events:none;z-index:50;
        }
        .page-stitch::before{
          content:'';position:absolute;inset:5px;
          border:1px dashed rgba(196,133,58,0.14);
          border-radius:6px;
        }

        .pd-nav{
          position:relative;z-index:10;
          padding:22px 48px;
          display:flex;align-items:center;justify-content:space-between;
          border-bottom:2px dashed rgba(196,133,58,0.28);
          margin:0 14px;
        }
        .pd-brand{display:flex;align-items:center;gap:10px;}
        .pd-brand-name{
          font-family:'Fjalla One',sans-serif;font-size:20px;
          letter-spacing:2.5px;color:#D4A853;
          text-shadow:0 1px 2px rgba(0,0,0,0.4);
        }
        .pd-nav-links{display:flex;gap:36px;align-items:center;}
        .pd-nav-links a{
          font-family:'JetBrains Mono',monospace;font-size:11px;
          letter-spacing:2.5px;text-transform:uppercase;
          color:rgba(212,168,83,0.65);text-decoration:none;
          transition:color 0.2s,text-shadow 0.2s;
          position:relative;padding:4px 0;
        }
        .pd-nav-links a:hover{color:#D4A853;text-shadow:0 0 8px rgba(212,168,83,0.4);}
        .pd-nav-links a::after{
          content:'';position:absolute;left:0;right:0;bottom:-2px;
          height:1px;background:#C48540;opacity:0;
          transform:scaleX(0.3);transform-origin:left;
          transition:opacity 0.2s,transform 0.2s;
        }
        .pd-nav-links a:hover::after{opacity:0.7;transform:scaleX(1);}
        .pd-nav-cta{
          font-family:'Fjalla One',sans-serif;font-size:12px;
          letter-spacing:1.5px;color:#0d1e38;background:#D4A853;
          border:none;padding:9px 18px;border-radius:6px;cursor:pointer;
          text-transform:uppercase;
          box-shadow:0 2px 0 #8a5a26,0 4px 12px rgba(0,0,0,0.3);
          transition:transform 0.1s,box-shadow 0.1s;
        }
        .pd-nav-cta:hover{
          transform:translateY(-1px);
          box-shadow:0 3px 0 #8a5a26,0 6px 14px rgba(0,0,0,0.35);
        }

        .pd-hero{
          position:relative;z-index:5;
          max-width:1200px;margin:0 auto;
          padding:80px 48px 60px;
          display:grid;grid-template-columns:1.1fr 1fr;
          gap:60px;align-items:center;
          min-height:calc(100vh - 90px);
        }
        .pd-patch{
          position:absolute;
          border:1.5px dashed rgba(196,133,58,0.18);
          background:rgba(196,133,58,0.03);
          border-radius:8px;pointer-events:none;
        }

        .pd-copy{position:relative;z-index:2;}
        .pd-eyebrow{
          display:inline-flex;align-items:center;gap:8px;
          font-family:'JetBrains Mono',monospace;font-size:10px;
          letter-spacing:3px;text-transform:uppercase;color:#C48540;
          border:1.5px dashed rgba(196,133,58,0.45);
          padding:6px 12px;border-radius:4px;margin-bottom:24px;
          background:rgba(196,133,58,0.05);
        }
        .pd-pulse{
          width:6px;height:6px;border-radius:50%;
          background:#D4A853;box-shadow:0 0 8px #D4A853;
          animation:pd-pulse 1.8s ease-in-out infinite;
        }
        @keyframes pd-pulse{
          0%,100%{opacity:0.4;transform:scale(0.85)}
          50%{opacity:1;transform:scale(1.1)}
        }

        .pd-h1{
          font-family:'Fjalla One',sans-serif;
          font-size:clamp(40px,5.6vw,76px);
          line-height:0.96;letter-spacing:1px;color:#D4A853;
          text-shadow:0 2px 0 rgba(0,0,0,0.25),0 6px 20px rgba(0,0,0,0.45);
          margin-bottom:22px;
        }
        .pd-h1 .accent{
          color:#C48540;position:relative;display:inline-block;
        }
        .pd-h1 .accent::after{
          content:'';position:absolute;left:0;right:0;bottom:6px;
          height:8px;background:rgba(196,133,58,0.18);z-index:-1;border-radius:2px;
        }

        .pd-lede{
          font-size:17px;line-height:1.65;
          color:rgba(212,168,83,0.78);
          max-width:520px;margin-bottom:36px;font-weight:300;
        }
        .pd-lede strong{color:#D4A853;font-weight:600;}

        .pd-cta-row{display:flex;align-items:center;gap:16px;margin-bottom:42px;}
        .pd-btn-primary{
          font-family:'Fjalla One',sans-serif;font-size:14px;
          letter-spacing:2px;color:#0d1e38;background:#D4A853;
          border:none;padding:14px 26px;border-radius:8px;cursor:pointer;
          text-transform:uppercase;
          box-shadow:0 3px 0 #8a5a26,0 8px 22px rgba(0,0,0,0.4);
          transition:transform 0.1s,box-shadow 0.1s;
          display:inline-flex;align-items:center;gap:8px;
        }
        .pd-btn-primary:hover{
          transform:translateY(-1px);
          box-shadow:0 4px 0 #8a5a26,0 10px 24px rgba(0,0,0,0.45);
        }
        .pd-btn-primary:active{
          transform:translateY(2px);
          box-shadow:0 1px 0 #8a5a26,0 4px 10px rgba(0,0,0,0.3);
        }
        .pd-btn-secondary{
          font-family:'JetBrains Mono',monospace;font-size:11px;
          letter-spacing:2px;text-transform:uppercase;
          color:#D4A853;background:transparent;
          border:1.5px dashed rgba(196,133,58,0.5);
          padding:13px 20px;border-radius:8px;cursor:pointer;
          transition:border-color 0.2s,background 0.2s;
        }
        .pd-btn-secondary:hover{
          border-color:#C48540;background:rgba(196,133,58,0.08);
        }

        .pd-tag-strip{display:flex;gap:14px;flex-wrap:wrap;align-items:center;}
        .pd-tag{
          font-family:'JetBrains Mono',monospace;font-size:10px;
          letter-spacing:2px;text-transform:uppercase;
          color:rgba(212,168,83,0.55);display:flex;align-items:center;gap:6px;
        }
        .pd-tag-dot{width:6px;height:6px;border-radius:50%;background:#C48540;opacity:0.7;}
        .pd-tag-sep{color:rgba(196,133,58,0.25);font-family:'JetBrains Mono',monospace;}

        .pd-stage{
          position:relative;z-index:2;
          display:flex;align-items:center;justify-content:center;
        }
        .pd-stage-frame{
          position:relative;
          width:min(440px,90%);aspect-ratio:1;
          border:2px dashed rgba(196,133,58,0.35);
          border-radius:14px;
          background:radial-gradient(ellipse at 50% 30%,rgba(196,133,58,0.07),transparent 60%),rgba(12,30,55,0.35);
          display:flex;align-items:center;justify-content:center;
          padding:28px;
          box-shadow:inset 0 0 60px rgba(0,0,0,0.4),0 30px 80px rgba(0,0,0,0.5);
        }
        .pd-stage-frame::before{
          content:'';position:absolute;inset:7px;
          border:1px dashed rgba(196,133,58,0.18);border-radius:8px;
        }
        .pd-stage-frame::after{
          content:'';position:absolute;inset:0;
          background:
            radial-gradient(circle at 14px 14px,#C48540 2.5px,transparent 3px),
            radial-gradient(circle at calc(100% - 14px) 14px,#C48540 2.5px,transparent 3px),
            radial-gradient(circle at 14px calc(100% - 14px),#C48540 2.5px,transparent 3px),
            radial-gradient(circle at calc(100% - 14px) calc(100% - 14px),#C48540 2.5px,transparent 3px);
          opacity:0.7;pointer-events:none;border-radius:14px;
        }
        .pd-logo-svg{
          width:100%;height:auto;
          filter:drop-shadow(0 8px 24px rgba(0,0,0,0.45));
          animation:pd-breathe 5s ease-in-out infinite;
        }
        @keyframes pd-breathe{
          0%,100%{transform:scale(1)}
          50%{transform:scale(1.015)}
        }
        .pd-stage-spec{
          position:absolute;bottom:-30px;left:0;right:0;
          text-align:center;font-family:'JetBrains Mono',monospace;
          font-size:9px;letter-spacing:3px;
          color:rgba(196,133,58,0.4);text-transform:uppercase;
        }

        .pd-footer{
          position:relative;z-index:5;margin:0 14px;
          padding:18px 48px;
          border-top:2px dashed rgba(196,133,58,0.22);
          display:flex;align-items:center;justify-content:space-between;
          font-family:'JetBrains Mono',monospace;font-size:10px;
          letter-spacing:2px;color:rgba(196,133,58,0.4);text-transform:uppercase;
        }
        .pd-footer-by{display:flex;align-items:center;gap:8px;}

        @media(max-width:880px){
          .pd-nav{padding:18px 24px;}
          .pd-nav-links{display:none;}
          .pd-hero{
            grid-template-columns:1fr;gap:40px;
            padding:48px 24px 40px;text-align:center;
          }
          .pd-copy .pd-eyebrow,.pd-copy .pd-cta-row,.pd-copy .pd-tag-strip{justify-content:center;}
          .pd-cta-row{justify-content:center;}
          .pd-lede{margin-left:auto;margin-right:auto;}
          .pd-footer{padding:14px 24px;font-size:9px;}
        }
      `}</style>

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
              <circle cx="100" cy="100" r="94"   fill="none" stroke="#C48540" stroke-width="10"/>
              <circle cx="100" cy="100" r="80.5" fill="rgba(28,59,107,0.92)" stroke="#C48540" stroke-width="6"/>
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
                fill="#D4A853" fillOpacity="0.14" stroke="#D4A853" stroke-width="7"/>
              <line x1="76"  y1="66" x2="76"  y2="84" stroke="#D4A853" stroke-width="11" strokeLinecap="round"/>
              <line x1="124" y1="66" x2="124" y2="84" stroke="#D4A853" stroke-width="11" strokeLinecap="round"/>
              <line x1="100" y1="92" x2="100" y2="100" stroke="#C48540" stroke-width="7" strokeDasharray="12,10" opacity="0.85"/>
              <rect x="54" y="108" width="92" height="36" rx="20"
                fill="rgba(196,133,58,0.08)" stroke="#C48540" stroke-width="7"/>
              <rect x="66"  y="116" width="18" height="20" rx="10" fill="#C48540" opacity="0.92"/>
              <rect x="116" y="116" width="18" height="20" rx="10" fill="#C48540" opacity="0.92"/>
              <circle cx="100" cy="100" r="80.5" fill="none" stroke="#C48540" stroke-width="6"/>
            </svg>
            <span className="pd-brand-name">PortDrop</span>
          </div>
          <div className="pd-nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#docs">Docs</a>
            <a href="#changelog">Changelog</a>
          </div>
          <button className="pd-nav-cta">Install →</button>
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
              <button className="pd-btn-primary">
                Get the Extension
                <span style={{fontSize:'16px',lineHeight:'1'}}>→</span>
              </button>
              <button className="pd-btn-secondary">View on GitHub</button>
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
                <circle cx="90" cy="90" r="82" fill="none" stroke="#C48540" stroke-width="2.5"/>
                {/* Inner ring — thinner, 12px gap from outer */}
                <circle cx="90" cy="90" r="68" fill="rgba(28,59,107,0.92)" stroke="#C48540" stroke-width="1.5"/>

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
                <rect x="72" y="28" width="36" height="26" rx="4"
                  fill="#D4A853" fillOpacity="0.14" stroke="#D4A853" stroke-width="1.8"/>
                {/* Prongs */}
                <line x1="81" y1="54" x2="81" y2="66" stroke="#D4A853" stroke-width="2.6" strokeLinecap="round"/>
                <line x1="99" y1="54" x2="99" y2="66" stroke="#D4A853" stroke-width="2.6" strokeLinecap="round"/>
                {/* Connector */}
                <line x1="90" y1="74" x2="90" y2="82"
                  stroke="#C48540" stroke-width="1.8"
                  strokeDasharray="2.5,2.5" opacity="0.85"/>
                {/* Socket — 12px from inner ring bottom */}
                <rect x="67" y="90" width="46" height="30" rx="5"
                  fill="rgba(196,133,58,0.08)" stroke="#C48540" stroke-width="1.8"/>
                <rect x="75" y="96" width="12" height="16" rx="2.5" fill="#C48540" opacity="0.92"/>
                <rect x="93" y="96" width="12" height="16" rx="2.5" fill="#C48540" opacity="0.92"/>

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
