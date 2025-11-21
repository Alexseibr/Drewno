import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { messagingApi } from '../api/client';
import { ConversationDetails, ConversationSummary } from '../types';
import { ConversationList } from '../components/ConversationList';
import { MessageList } from '../components/MessageList';
import { GuestPanel } from '../components/GuestPanel';
import { MessageComposer } from '../components/MessageComposer';

const quickReplies = [
  'Здравствуйте! Напишите, пожалуйста, даты заезда/выезда и сколько будет взрослых/детей.',
  'Стоимость зависит от дат и состава гостей, сейчас проверю и вернусь с вариантом 🙂',
];

const AdminChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [details, setDetails] = useState<ConversationDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    messagingApi.listConversations().then((data) => {
      setConversations(data);
      if (data.length && !selectedId) {
        setSelectedId(data[0].id);
      }
    });
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingDetails(true);
    messagingApi
      .getConversation(selectedId)
      .then((res) => setDetails(res))
      .finally(() => setLoadingDetails(false));
  }, [selectedId]);

  const sortedConversations = useMemo(
    () =>
      [...conversations].sort((a, b) => dayjs(b.lastMessageAt).valueOf() - dayjs(a.lastMessageAt).valueOf()),
    [conversations],
  );

  const handleSend = async (text: string) => {
    if (!details) return;
    const sent = await messagingApi.sendMessage(details.conversation.id, details.conversation.channel, text);
    setDetails({
      ...details,
      messages: [...details.messages, sent],
      conversation: {
        ...details.conversation,
        lastMessageAt: sent.timestamp,
        lastMessageText: sent.text,
      },
    });
    setConversations((prev) =>
      prev.map((c) => (c.id === details.conversation.id ? { ...c, lastMessageAt: sent.timestamp, lastMessageText: sent.text } : c)),
    );
  };

  return (
    <div className="page">
      <ConversationList items={sortedConversations} activeId={selectedId} onSelect={setSelectedId} />
      <div className="main-panel">
        <div className="card messages-card">
          <div className="sidebar-header" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{details?.conversation.contactName || 'Выберите диалог'}</div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>
                {details ? `Канал: ${details.conversation.channel}` : 'Ожидание'}
              </div>
            </div>
            {loadingDetails && <span className="badge">Загрузка...</span>}
          </div>
          <MessageList messages={details?.messages || []} />
          <MessageComposer onSend={handleSend} disabled={!details} quickReplies={quickReplies} />
        </div>
        <GuestPanel contact={details?.contact} bookings={details?.bookings || []} />
      </div>
    </div>
  );
};

export default AdminChatPage;
