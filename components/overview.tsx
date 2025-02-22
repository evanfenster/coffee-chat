import { motion } from 'framer-motion';
import { APP_CONFIG } from '@/config/app.config';

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
          <h1 className="text-4xl font-semibold brand-text text-[hsl(var(--brand-title))]">
            {APP_CONFIG.welcome.title}
          </h1>
        </div>
        
        <div className="space-y-4 text-muted-foreground">
          <p className="text-lg">
            {APP_CONFIG.welcome.tagline}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
