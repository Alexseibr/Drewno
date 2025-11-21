import React from 'react';
import dayjs from 'dayjs';
import { MessageItem } from '../types';

interface MessageListProps {
  messages: MessageItem[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="messages-list">
      {messages.map((msg) => (
        <div key={msg.id} className={`message-row message-${msg.direction === 'in' ? 'in' : 'out'}`}>
          <div className="message-bubble">
            <div className="message-author">{msg.direction === 'in' ? 'Гость' : 'Оператор'}</div>
            <div>{msg.text}</div>
            <div className="message-time">{dayjs(msg.timestamp).format('DD.MM HH:mm')}</div>
          </div>
        </div>
      ))}
      {messages.length === 0 && <div className="placeholder">Нет сообщений</div>}
    </div>
  );
};
