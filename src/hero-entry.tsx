/**
 * Module: Interactive landing hero
 * Purpose: Provide a responsive, pointer-aware hero animation using Framer Motion
 * Used by: React homepage route /
 * Dependencies: React, framer-motion, landing page CSS
 * Public functions: InteractiveHero()
 * Side effects: Mounts a React island and responds to pointer movement; no network calls
 */
import { MotionConfig, motion, useReducedMotion, useSpring } from 'framer-motion';
import { useCallback, useEffect, useState, type PointerEvent } from 'react';
import { useLanguage } from './lib/language';

const heroParticles = [
  { left: '8%', top: '18%', size: 5, drift: 18, duration: 8, delay: 0 },
  { left: '21%', top: '72%', size: 3, drift: 12, duration: 11, delay: 1.4 },
  { left: '35%', top: '28%', size: 4, drift: 22, duration: 9, delay: .8 },
  { left: '47%', top: '84%', size: 6, drift: 15, duration: 12, delay: 2.2 },
  { left: '58%', top: '16%', size: 3, drift: 20, duration: 10, delay: .4 },
  { left: '67%', top: '68%', size: 5, drift: 26, duration: 13, delay: 1.8 },
  { left: '78%', top: '30%', size: 4, drift: 16, duration: 9, delay: 3 },
  { left: '89%', top: '77%', size: 3, drift: 23, duration: 11, delay: 1 },
  { left: '94%', top: '12%', size: 6, drift: 14, duration: 10, delay: 2.7 },
];

export function InteractiveHero() {
  const reduceMotion = useReducedMotion();
  const { language } = useLanguage();
  const [titleIndex, setTitleIndex] = useState(0);
  const [titleText, setTitleText] = useState('');
  const titleSlides = language === 'id' ? ['Digital terpercaya', 'Web lebih jelas', 'Produk berdampak'] : ['Trusted digital work', 'Clearer web products', 'Work with impact'];
  const titleSuffix = language === 'id' ? 'punya arah.' : 'clear direction.';
  const tiltX = useSpring(0, { stiffness: 140, damping: 20, mass: 0.7 });
  const tiltY = useSpring(0, { stiffness: 140, damping: 20, mass: 0.7 });
  const abstractX = useSpring(0, { stiffness: 90, damping: 24, mass: 1 });
  const abstractY = useSpring(0, { stiffness: 90, damping: 24, mass: 1 });

  useEffect(() => { setTitleIndex(0); setTitleText(''); }, [language]);
  useEffect(() => {
    const target = titleSlides[titleIndex];
    if (reduceMotion) {
      setTitleText(target);
      return;
    }
    if (titleText.length < target.length) {
      const timer = window.setTimeout(() => setTitleText(target.slice(0, titleText.length + 1)), 64);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => { setTitleIndex((index) => (index + 1) % titleSlides.length); setTitleText(''); }, 2200);
    return () => window.clearTimeout(timer);
  }, [language, reduceMotion, titleIndex, titleText]);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;
    tiltY.set(pointerX * 10);
    tiltX.set(-pointerY * 7);
    abstractX.set(pointerX * -22);
    abstractY.set(pointerY * -16);
  }, [abstractX, abstractY, reduceMotion, tiltX, tiltY]);

  const resetPointer = useCallback(() => { tiltX.set(0); tiltY.set(0); abstractX.set(0); abstractY.set(0); }, [abstractX, abstractY, tiltX, tiltY]);

  return <MotionConfig reducedMotion="user">
    <motion.div className="hero-abstract" aria-hidden="true">
      {heroParticles.map((particle, index) => <motion.span key={`${particle.left}-${particle.top}`} className={`hero-particle hero-particle-${index % 3}`} style={{ left: particle.left, top: particle.top, width: particle.size, height: particle.size }} animate={reduceMotion ? undefined : { x: [0, particle.drift, -particle.drift * .6, 0], y: [0, -particle.drift * .7, particle.drift * .45, 0], opacity: [.18, .8, .35, .18], scale: [1, 1.6, .85, 1] }} transition={reduceMotion ? undefined : { duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: 'easeInOut' }} />)}
      <motion.div className="hero-abstract-glow hero-abstract-glow-lime" animate={reduceMotion ? undefined : { x: [0, 28, -10, 0], y: [0, -18, 12, 0], scale: [1, 1.08, .96, 1] }} transition={reduceMotion ? undefined : { duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="hero-abstract-glow hero-abstract-glow-coral" animate={reduceMotion ? undefined : { x: [0, -24, 12, 0], y: [0, 14, -10, 0], scale: [1, .94, 1.06, 1] }} transition={reduceMotion ? undefined : { duration: 19, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="hero-abstract-ring hero-abstract-ring-outer" style={{ x: abstractX, y: abstractY }} animate={reduceMotion ? undefined : { rotate: 360 }} transition={reduceMotion ? undefined : { duration: 42, repeat: Infinity, ease: 'linear' }} />
      <motion.div className="hero-abstract-ring hero-abstract-ring-inner" style={{ x: abstractX, y: abstractY }} animate={reduceMotion ? undefined : { rotate: -360 }} transition={reduceMotion ? undefined : { duration: 30, repeat: Infinity, ease: 'linear' }} />
      <div className="hero-abstract-grid" />
    </motion.div>
    <motion.div className="hero-copy" initial={reduceMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: [0.22, 1, 0.36, 1] }}>
      <p className="eyebrow"><span className="status-dot" />Portfolio digital · Indonesia</p>
      <h1><span className="hero-title-viewport"><motion.span className="hero-title-slide" aria-live="polite">{titleText}<span className="hero-title-caret" aria-hidden="true" /></motion.span></span><br /><em>{titleSuffix}</em></h1>
      <p className="hero-lede">Saya Suprayogo. Saya merancang dan membangun website serta aplikasi web untuk bisnis yang ingin terlihat lebih kredibel dan bergerak lebih cepat.</p>
      <div className="hero-actions"><a className="button button-dark" href="#work">Lihat karya <span>↓</span></a><a className="text-link" href="#contact">Diskusikan project <span>↗</span></a></div>
    </motion.div>
    <motion.div className="hero-art" aria-label="Eksplorasi visual portfolio" onPointerMove={handlePointerMove} onPointerLeave={resetPointer} style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 900 }} initial={reduceMotion ? false : { opacity: 0, scale: .94, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: .12, duration: .85, ease: [0.22, 1, 0.36, 1] }}>
      <motion.div className="art-orbit" animate={reduceMotion ? undefined : { rotate: 360 }} transition={reduceMotion ? undefined : { duration: 28, repeat: Infinity, ease: 'linear' }} />
      <div className="art-label art-label-top">DESIGN /<br /><b>BUILD</b></div>
      <motion.div className="art-card art-card-main" whileHover={reduceMotion ? undefined : { rotate: -3, scale: 1.025, y: -8 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
        <div className="window-bar"><i /><i /><i /><span>selected / 01</span></div><div className="dashboard-lines"><b /><b /><b /><b /></div><div className="dashboard-number">10<span>+</span></div><p>projects shipped<br />with intention</p>
      </motion.div>
      <motion.div className="art-card art-card-float" animate={reduceMotion ? undefined : { y: [0, -12, 0], rotate: [8, 10, 8] }} transition={reduceMotion ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut' }} whileHover={reduceMotion ? undefined : { scale: 1.08 }}><span>↗</span><strong>Ideas into<br /><em>impact.</em></strong></motion.div>
      <div className="art-label art-label-bottom">RAYDIANSYAH.COM<br /><span>SURABAYA — ID</span></div>
    </motion.div>
  </MotionConfig>;
}
