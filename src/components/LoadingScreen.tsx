import React from 'react';
import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LoadingScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 bg-white flex items-center justify-center z-50"
    >
      <div className="flex flex-col items-center gap-7">

        {/* Logo */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <motion.div
            className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm"
            animate={{ scale: [1, 1.07, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Leaf className="w-5 h-5 text-white" />
          </motion.div>
          <span className="text-2xl font-bold text-stone-900 tracking-tight">
            Life Store
          </span>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          className="w-44 h-px bg-stone-100 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
          />
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-xs text-stone-400 tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          {t("home.hero.badge")}
        </motion.p>

      </div>
    </motion.div>
  );
};

export default LoadingScreen;
