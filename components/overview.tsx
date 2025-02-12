import { motion } from 'framer-motion';
import Link from 'next/link';

import { CoffeeIcon, MessageIcon } from './icons';

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="p-8 flex flex-col gap-8 leading-relaxed text-center max-w-xl mx-auto">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold brand-text text-amber-800 dark:text-amber-200">Welcome to Coffee Chat</h1>
          <p className="flex flex-row justify-center gap-4 items-center text-amber-700 dark:text-amber-300">
            <CoffeeIcon size={32} className="animate-[wiggle_1s_ease-in-out_infinite]" />
            <span className="font-playfair text-2xl">+</span>
            <MessageIcon size={32} />
          </p>
        </div>
        
        <div className="space-y-4 text-muted-foreground">
          <p className="text-lg">
            Let&apos;s find your next favorite coffee.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
