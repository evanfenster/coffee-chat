import { Suggestion } from '@/lib/db/schema';
import { UseChatHelpers } from 'ai/react';
import { Dispatch, ReactNode, SetStateAction } from 'react';
import { UIBlock } from './block';

export type BlockActionContext<M = any> = {
  content: string;
  handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  mode: 'edit' | 'diff';
  metadata: M;
  setMetadata: Dispatch<SetStateAction<M>>;
};

type BlockAction<M = any> = {
  icon: ReactNode;
  label?: string;
  description: string;
  onClick: (context: BlockActionContext<M>) => Promise<void> | void;
  isDisabled?: (context: BlockActionContext<M>) => boolean;
};

export type BlockToolbarContext = {
  appendMessage: UseChatHelpers['append'];
};

export type BlockToolbarItem = {
  description: string;
  icon: ReactNode;
  onClick: (context: BlockToolbarContext) => void;
};

interface BlockContent<M = any> {
  title: string;
  content: string;
  mode: 'edit' | 'diff';
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  status: 'streaming' | 'idle';
  suggestions: Array<Suggestion>;
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
  isInline: boolean;
  getDocumentContentById: (index: number) => string;
  isLoading: boolean;
  metadata: M;
  setMetadata: Dispatch<SetStateAction<M>>;
}

export type StreamPartType =
  | 'text-delta'
  | 'title'
  | 'id'
  | 'suggestion'
  | 'clear'
  | 'finish'
  | 'kind'
  | 'block';

export interface StreamPart {
  type: StreamPartType;
  content: string;
}

export interface InitializeParameters<M = any> {
  documentId: string;
  setMetadata: Dispatch<SetStateAction<M>>;
}

export interface StreamPartParameters<M = any> {
  streamPart: StreamPart;
  setMetadata: Dispatch<SetStateAction<M>>;
  setBlock: Dispatch<SetStateAction<UIBlock>>;
}

export interface ContentParameters<M = any> {
  title: string;
  content: string;
  mode: 'edit' | 'diff';
  status: 'streaming' | 'idle';
  currentVersionIndex: number;
  suggestions: Array<any>;
  onSaveContent: (content: string, debounce: boolean) => void;
  isInline: boolean;
  isCurrentVersion: boolean;
  getDocumentContentById: (index: number) => string;
  isLoading: boolean;
  metadata: M;
  setMetadata: Dispatch<SetStateAction<M>>;
}

export class Block<K extends string, M = any> {
  kind: K;
  description: string;
  initialize?: (params: InitializeParameters<M>) => Promise<void>;
  onStreamPart?: (params: StreamPartParameters<M>) => void;
  content: (params: ContentParameters<M>) => JSX.Element;
  actions?: Array<BlockAction<M>>;
  toolbar?: Array<BlockToolbarItem>;

  constructor(config: {
    kind: K;
    description: string;
    initialize?: (params: InitializeParameters<M>) => Promise<void>;
    onStreamPart?: (params: StreamPartParameters<M>) => void;
    content: (params: ContentParameters<M>) => JSX.Element;
    actions?: Array<BlockAction<M>>;
    toolbar?: Array<BlockToolbarItem>;
  }) {
    this.kind = config.kind;
    this.description = config.description;
    this.initialize = config.initialize;
    this.onStreamPart = config.onStreamPart;
    this.content = config.content;
    this.actions = config.actions;
    this.toolbar = config.toolbar;
  }
}
