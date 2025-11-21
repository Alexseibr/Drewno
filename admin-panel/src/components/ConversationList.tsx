import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ConversationSummary } from '../types';

dayjs.extend(relativeTime);

interface ConversationListProps {
  items: ConversationSummary[];
  activeId?: string;
  onSelect: (id: string) => void;
}

const channelLabel: Record<ConversationSummary['channel'], string> = {
  telegram: 'Telegram',
  instagram: 'Instagram',
};

export const ConversationList: React.FC<ConversationListProps> = ({ items, activeId, onSelect }) => {
  return (
    <div className="card sidebar">
      <div className="sidebar-header">
        <span>Диалоги</span>
        <span className="badge">{items.length}</span>
      </div>
      <div className="sidebar-list">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <div
              key={item.id}
              className={`conversation-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <div className="conversation-title">{item.contactName}</div>
              <div className="conversation-meta">
                <span>{channelLabel[item.channel]}</span>
                <span>•</span>
                <span>{dayjs(item.lastMessageAt).fromNow()}</span>
              </div>
              <div className="conversation-snippet">{item.lastMessageText || 'Нет сообщений'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
