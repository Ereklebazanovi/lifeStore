import React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
}

const fade: Variants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.18, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.1, ease: "easeIn" } },
};

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className="w-full">{children}</div>;

  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={fade}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
