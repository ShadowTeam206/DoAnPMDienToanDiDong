import { useEffect, useRef, useState } from 'react';

const isSameDay = (dateA, dateB) =>
  dateA.getDate() === dateB.getDate() &&
  dateA.getMonth() === dateB.getMonth() &&
  dateA.getFullYear() === dateB.getFullYear();

const formatMessageTimestamp = (value) => {
  const messageDate = new Date(value);
  if (Number.isNaN(messageDate.getTime())) return '';

  const now = new Date();
  const timeText = messageDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  if (isSameDay(messageDate, now)) {
    return `Hôm nay lúc ${timeText}`;
  }

  const dateText = messageDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return `${dateText} lúc ${timeText}`;
};

const getMessageTimeValue = (message) =>
  message?.createdAt ?? message?.created_at ?? message?.timestamp ?? null;

function MessageList({ messages, scrollBehavior, onAction, currentUser }) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const [menu, setMenu] = useState(null);

  const isRevokedMessage = (message) =>
    Boolean(message?.isRevoked || message?.is_revoked || message?.content === 'Tin nhắn đã được thu hồi');

  const openContextMenu = (e, message, isMine) => {
    const revoked = isRevokedMessage(message);
    if (revoked) return;

    const MENU_WIDTH = 176;
    const MENU_HEIGHT = isMine ? 180 : 148;
    const padding = 8;

    const x = Math.min(e.clientX, window.innerWidth - MENU_WIDTH - padding);
    const y = Math.min(e.clientY, window.innerHeight - MENU_HEIGHT - padding);

    setMenu({ x: Math.max(padding, x), y: Math.max(padding, y), message, isMine });
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !bottomRef.current) return;

    const threshold = 80;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;

    if (isAtBottom) {
      bottomRef.current.scrollIntoView({
        behavior: scrollBehavior === 'smooth' ? 'smooth' : 'auto'
      });
    }
  }, [messages, scrollBehavior]);

  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 relative">
      {messages.map((m) => {
        const messageTimeValue = getMessageTimeValue(m);
        const isMine =
          (currentUser?.id && (m.userId === currentUser.id || m.senderId === currentUser.id)) ||
          (currentUser?.username && m.username === currentUser.username);

        return (
          <div
            key={m.id ?? `${m.username}-${messageTimeValue ?? 'no-time'}-${m.content}`}
            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            onContextMenu={(e) => {
              e.preventDefault();
              openContextMenu(e, m, isMine);
            }}
          >
            {!isMine && (
              <div className="mr-2 mt-5 flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#6a5acd] to-[#4f46e5] text-white flex items-center justify-center text-xs font-semibold shadow-lg ring-2 ring-black/20">
                  {m.username?.[0]?.toUpperCase() || '?'}
                </div>
              </div>
            )}

            <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className="mb-0.5 text-[11px] text-textSecondary px-1">
                {isMine ? 'Bạn' : m.username}
                {messageTimeValue ? ` • ${formatMessageTimestamp(messageTimeValue)}` : ''}
              </div>

              <div
                className={`rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] shadow-md ${
                  isMine
                    ? 'bg-accent text-white rounded-br-md'
                    : 'bg-[#2b2d31] text-textPrimary rounded-bl-md border border-white/5'
                }`}
              >
                {m.replyContent && (
                  <div
                    className={`mb-1 rounded border-l-2 px-2 py-1 text-xs ${
                      isMine
                        ? 'border-white/70 bg-black/20 text-white/85'
                        : 'border-accent/70 bg-black/20 text-textSecondary'
                    }`}
                  >
                    Trả lời {m.replyUsername || 'tin nhắn'}: {m.replyContent}
                  </div>
                )}
                <div>{m.content}</div>
              </div>
            </div>
          </div>
        );
      })}

      {menu && (
        <div
          className="fixed z-50 w-44 rounded-md bg-[#1f2124] border border-white/10 p-1 text-xs shadow-xl"
          style={{ left: menu.x, top: menu.y }}
        >
          {[
            { id: 'reply', label: 'Trả lời' },
            { id: 'copy', label: 'Sao chép' },
            { id: 'forward', label: 'Chuyển tiếp...' },
            { id: 'pin', label: 'Ghim' },
            ...(menu?.isMine ? [{ id: 'revoke', label: 'Thu hồi' }] : [])
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full text-left px-2 py-1 rounded hover:bg-white/10"
              onClick={() => {
                onAction?.(item.id, menu.message);
                setMenu(null);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
