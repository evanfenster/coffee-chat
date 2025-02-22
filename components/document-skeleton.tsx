'use client';

import { BlockKind } from './block';

export const DocumentSkeleton = ({ blockKind }: { blockKind: BlockKind }) => {
  return (
    <div className="flex flex-col gap-4 w-full justify-center items-center h-[calc(100dvh-60px)]">
      <div className="animate-pulse rounded-lg bg-muted-foreground/20 w-96 h-96" />
    </div>
  );
};

export const InlineDocumentSkeleton = () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="animate-pulse rounded-lg bg-muted-foreground/20 h-4 w-full" />
      <div className="animate-pulse rounded-lg bg-muted-foreground/20 h-4 w-full" />
      <div className="animate-pulse rounded-lg bg-muted-foreground/20 h-4 w-3/4" />
    </div>
  );
};
