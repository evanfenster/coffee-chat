'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { ChatRequestOptions, CreateMessage, Message } from 'ai';
import { memo } from 'react';

interface SuggestedActionsProps {
  chatId: string;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
}

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: 'Find my perfect match',
      label: 'based on my taste',
      action: "I'd love to find a coffee that matches my taste. Help me discover what I enjoy and what I don't.",
    },
    {
      title: 'Surprise me',
      label: 'discover something new!',
      action: "I'm feeling adventurous! Can you surprise me with an interesting coffee bean recommendation? I'm open to trying something unique and different.",
    },
    {
      title: 'Explore origins',
      label: 'from around the world',
      action: "I'm curious about coffee from different parts of the world. Could you recommend some interesting beans from regions known for unique flavors?",
    },
    {
      title: 'Recomend some',
      label: 'light & fruity coffee beans',
      action: "I love light, fruity coffees with bright flavors. Could you help me find beans with notes of berries, citrus, or florals?",
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 gap-2 w-full">
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
