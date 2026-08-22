/**
 * Module: Interactive landing hero
 * Purpose: Provide a responsive, pointer-aware hero animation using Framer Motion
 * Used by: React homepage route /
 * Dependencies: React, framer-motion, landing page CSS
 * Public functions: InteractiveHero()
 * Side effects: Mounts a React island and responds to pointer movement; no network calls
 */
import { MotionConfig, motion, useReducedMotion, useSpring } from 'framer-motion';
import { useCallback, type PointerEvent } from 'react';

export function InteractiveHero() {
  const reduceMotion = useReducedMotion();
  const tiltX = useSpring(0, { stiffness: 140, damping: 20, mass: 0.7 });
  const tiltY = useSpring(0, { stiffness: 140, damping: 20, mass: 0.7 });

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    tiltY.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 10);
    tiltX.set(-((event.clientY - bounds.top) / bounds.height - 0.5) * 7);
  }, [reduceMotion, tiltX, tiltY]);

  const resetPointer = useCallback(() => { tiltX.set(0); tiltY.set(0); }, [tiltX, tiltY]);

  return <MotionConfig reducedMotion="user">
    <motion.div className="hero-copy" initial={reduceMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: [0.22, 1, 0.36, 1] }}>
      <p className="eyebrow"><span className="status-dot" />Portfolio digital · Indonesia</p>
      <h1>Website yang<br /><em>punya arah.</em></h1>
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
