import { useState } from 'react';

function MessageInput({ onSend, disabled, onTypingChange, replyDraft, onCancelReply }) {
  const [value, setValue] = useState('');

  const handleChange = (nextValue) => {
    setValue(nextValue);
    if (onTypingChange) {
      onTypingChange(Boolean(nextValue.trim()));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 1000) return;
    onSend(trimmed);
    setValue('');
    if (onTypingChange) {
      onTypingChange(false);
    }
  };

  const handleBlur = () => {
    if (onTypingChange) {
      onTypingChange(false);
    }
  };

  return (
    <div className="px-4 pb-4 pt-1 bg-[#313338] border-t border-black/40">
      {replyDraft && (
        <div className="mb-2 rounded border-l-2 border-accent/80 bg-black/20 px-3 py-2 text-xs text-textSecondary flex items-center justify-between gap-2">
          <div className="truncate">
            Đang trả lời <span className="text-textPrimary">{replyDraft.username || 'người dùng'}</span>: {replyDraft.content}
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="text-[11px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20"
          >
            Hủy
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={disabled ? 'Đang kết nối...' : 'Nhập tin nhắn...'}
          disabled={disabled}
          className="w-full rounded-md bg-inputBg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent placeholder:text-textSecondary disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </form>
    </div>
  );
}

export default MessageInput;
