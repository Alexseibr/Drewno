import React, { useState } from 'react';

interface MessageComposerProps {
  onSend: (text: string) => Promise<void> | void;
  disabled?: boolean;
  quickReplies?: string[];
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ onSend, disabled, quickReplies = [] }) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      setSending(true);
      await onSend(text.trim());
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="input-area">
      <div className="input-row">
        <textarea
          placeholder="Напишите ответ..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled || sending}
        />
        <button className="button-primary" disabled={disabled || sending} onClick={handleSend}>
          {sending ? 'Отправка...' : 'Отправить'}
        </button>
      </div>
      {quickReplies.length > 0 && (
        <div className="quick-replies">
          {quickReplies.map((reply) => (
            <button key={reply} className="quick-reply" onClick={() => setText(reply)} disabled={disabled || sending}>
              {reply}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
