import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface FlipWordsProps {
  words: string[];
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const FlipWords: React.FC<FlipWordsProps> = ({
  words,
  duration = 2800,
  className = '',
  style,
}) => {
  const [currentWord, setCurrentWord] = useState(words[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  const startAnimation = useCallback(() => {
    const next = words[words.indexOf(currentWord) + 1] || words[0];
    setCurrentWord(next);
    setIsAnimating(true);
  }, [currentWord, words]);

  useEffect(() => {
    if (!isAnimating) {
      const timer = setTimeout(startAnimation, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isAnimating, duration, startAnimation]);

  return (
    <span style={{ display: 'inline-block', position: 'relative' }}>
      <AnimatePresence mode="wait" onExitComplete={() => setIsAnimating(false)}>
        <motion.span
          key={currentWord}
          initial={{ opacity: 0, y: 18, scale: 0.85, rotateX: -40 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, y: -22, scale: 1.1, rotateX: 60 }}
          transition={{ type: 'spring', stiffness: 140, damping: 14, mass: 1 }}
          className={className}
          style={{ display: 'inline-block', position: 'relative', ...style }}
        >
          {/* Glow background */}
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.35 }}
            exit={{ scale: 1.2, opacity: 0 }}
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, rgba(147,197,253,0.4), rgba(110,231,183,0.4))',
              filter: 'blur(12px)', borderRadius: '8px', zIndex: -1,
              display: 'block',
            }}
          />

          {/* Letter-by-letter animation */}
          {currentWord.split('').map((letter, idx) => (
            <motion.span
              key={`${currentWord}-${idx}`}
              initial={{ opacity: 0, y: 16, scale: 0.5, rotateY: -90 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
              transition={{ delay: idx * 0.045, duration: 0.38, type: 'spring', stiffness: 120, damping: 12 }}
              style={{ display: 'inline-block', transformStyle: 'preserve-3d' }}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

export default FlipWords;
