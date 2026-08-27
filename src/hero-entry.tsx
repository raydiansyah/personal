/**
 * Module: Interactive landing hero
 * Purpose: Preserve the signature orbital hero while adding concise developer positioning and role typewriter copy
 * Used by: React homepage route /
 * Dependencies: React, GSAP, language context, landing page CSS
 * Public functions: InteractiveHero()
 * Side effects: Mounts a React island, animates decorative elements, and responds to pointer movement; no network calls
 */
import gsap from 'gsap';
import { useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { useLanguage } from './lib/language';

const heroParticles = [
  { left: '8%', top: '18%', size: 5, drift: 18, duration: 8, delay: 0 }, { left: '21%', top: '72%', size: 3, drift: 12, duration: 11, delay: 1.4 },
  { left: '35%', top: '28%', size: 4, drift: 22, duration: 9, delay: .8 }, { left: '47%', top: '84%', size: 6, drift: 15, duration: 12, delay: 2.2 },
  { left: '58%', top: '16%', size: 3, drift: 20, duration: 10, delay: .4 }, { left: '67%', top: '68%', size: 5, drift: 26, duration: 13, delay: 1.8 },
  { left: '78%', top: '30%', size: 4, drift: 16, duration: 9, delay: 3 }, { left: '89%', top: '77%', size: 3, drift: 23, duration: 11, delay: 1 },
  { left: '94%', top: '12%', size: 6, drift: 14, duration: 10, delay: 2.7 },
];
const roles = ['Developer', 'Trainer', 'Assessor', 'Entrepreneur'];

export function InteractiveHero() {
  const reduceMotion = useReducedMotion();
  const { language } = useLanguage();
  const id = language === 'id';
  const [roleIndex, setRoleIndex] = useState(0);
  const [roleText, setRoleText] = useState(roles[0]);
  const rootRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduceMotion) { setRoleText(roles[roleIndex]); return; }
    const target = roles[roleIndex];
    if (roleText.length < target.length) {
      const timer = window.setTimeout(() => setRoleText(target.slice(0, roleText.length + 1)), 70);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => { setRoleIndex((current) => (current + 1) % roles.length); setRoleText(''); }, 1700);
    return () => window.clearTimeout(timer);
  }, [reduceMotion, roleIndex, roleText]);

  useLayoutEffect(() => {
    if (!rootRef.current || reduceMotion) return;
    const context = gsap.context(() => {
      gsap.fromTo('.hero-copy', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .8, ease: 'power4.out' });
      gsap.fromTo('.hero-art', { autoAlpha: 0, y: 18, scale: .96 }, { autoAlpha: 1, y: 0, scale: 1, duration: .9, delay: .12, ease: 'power4.out' });
      gsap.to('.hero-particle', { y: 'random(-18, 18)', x: 'random(-12, 12)', opacity: 'random(.2, .75)', scale: 'random(.8, 1.5)', duration: 'random(5, 11)', repeat: -1, yoyo: true, stagger: .12, ease: 'sine.inOut' });
    }, rootRef);
    return () => context.revert();
  }, [reduceMotion]);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType === 'touch' || !artRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    gsap.to(artRef.current, { rotateY: x * 7, rotateX: y * -5, duration: .7, ease: 'power3.out', overwrite: true });
  }, [reduceMotion]);
  const resetPointer = useCallback(() => { if (artRef.current && !reduceMotion) gsap.to(artRef.current, { rotateX: 0, rotateY: 0, duration: .8, ease: 'power3.out', overwrite: true }); }, [reduceMotion]);

  return <div ref={rootRef} className="hero-motion-scope">
    <div className="hero-abstract" aria-hidden="true">
      {heroParticles.map((particle, index) => <span key={`${particle.left}-${particle.top}`} className={`hero-particle hero-particle-${index % 3}`} style={{ left: particle.left, top: particle.top, width: particle.size, height: particle.size }} />)}
      <div className="hero-abstract-glow hero-abstract-glow-lime" /><div className="hero-abstract-glow hero-abstract-glow-coral" /><div className="hero-abstract-ring hero-abstract-ring-outer" /><div className="hero-abstract-ring hero-abstract-ring-inner" />
    </div>
    <div className="hero-copy">
      <p className="eyebrow"><span className="status-dot" />Web Developer · IT Professional</p>
      <h1>{id ? <>Produk berdampak<br /><em>punya arah.</em></> : <>Digital products<br /><em>with direction.</em></>}</h1>
      <p className="hero-lede">{id ? 'Web Developer dengan perspektif software, pelatihan, asesmen kompetensi, dan kebutuhan bisnis.' : 'A Web Developer connecting software, learning, competency, and business context.'}</p>
      <div className="hero-role-type" aria-live="polite"><span>{id ? 'Bekerja sebagai' : 'Working as'}</span><strong>{roleText}</strong><i aria-hidden="true" /></div>
      <div className="hero-actions"><a className="button button-light" href="#work">{id ? 'Lihat karya' : 'View my work'} <span>↓</span></a><a className="text-link" href="#contact">{id ? 'Mari berkolaborasi' : "Let's work together"} <span>↗</span></a></div>
    </div>
    <div ref={artRef} className="hero-art" aria-label={id ? 'Eksplorasi visual portfolio' : 'Portfolio visual exploration'} onPointerMove={handlePointerMove} onPointerLeave={resetPointer}>
      <div className="art-orbit" /><div className="art-label art-label-top">DESIGN /<br /><b>BUILD</b></div>
      <div className="art-card art-card-main"><div className="window-bar"><i /><i /><i /><span>selected / 01</span></div><div className="dashboard-lines"><b /><b /><b /><b /></div><div className="dashboard-number">10<span>+</span></div><p>projects shipped<br />with intention</p></div>
      <div className="art-card art-card-float"><span>↗</span><strong>Ideas into<br /><em>impact.</em></strong></div><div className="art-label art-label-bottom">RAYDIANSYAH.COM<br /><span>SURABAYA — ID</span></div>
    </div>
  </div>;
}
