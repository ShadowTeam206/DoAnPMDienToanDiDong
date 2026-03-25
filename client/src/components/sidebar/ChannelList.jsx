import { useState } from 'react';
import useChatStore from '../../store/chatStore';
import api from '../../api/axios';

function ChannelList() {
  const channels = useChatStore((s) => s.channels);
  const currentRoom = useChatStore((s) => s.currentRoom);
  const setRoom = useChatStore((s) => s.setRoom);
  const addRoomLocal = useChatStore((s) => s.addRoomLocal);
  const removeRoom = useChatStore((s) => s.removeRoom);

  const [error, setError] = useState('');

  const handleAddRoom = async () => {
    const roomName = window.prompt('Nhập tên đoạn chat mới');
    if (roomName == null) return;

    try {
      const res = await api.post('/api/chat/rooms', { name: roomName });
      addRoomLocal(res.data);
      setError('');
    } catch (err) {
      const message = err.response?.data?.message;
      setError(message || 'Tạo đoạn chat thất bại');
    }
  };

  const handleRemoveRoom = async (e, roomId) => {
    e.stopPropagation();
    const confirmed = window.confirm('Bạn có chắc muốn xóa đoạn chat này không?');
    if (!confirmed) return;

    try {
      await api.delete(`/api/chat/room/${encodeURIComponent(roomId)}`);
      removeRoom(roomId);
      setError('');
    } catch {
      setError('Xóa đoạn chat thất bại, vui lòng thử lại');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-3 py-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-textSecondary">
        <span>Channels</span>
        <button
          type="button"
          onClick={handleAddRoom}
          className="h-5 w-5 rounded hover:bg-[#35373c] text-base leading-none"
          title="Tạo đoạn chat mới"
        >
          +
        </button>
      </div>

      {error && (
        <div className="mx-2 mb-2 rounded border border-red-500/40 bg-red-900/20 px-2 py-1 text-[11px] text-red-300">
          {error}
        </div>
      )}

      <div className="flex-1 px-2 space-y-1 overflow-y-auto pb-4">
        {channels.map((ch) => {
          const active = currentRoom === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => setRoom(ch.id)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-[#404249] text-textPrimary'
                  : 'text-textSecondary hover:bg-[#35373c] hover:text-textPrimary'
              }`}
            >
              <span className="flex items-center min-w-0">
                <span className="mr-2 text-lg text-textSecondary">#</span>
                <span className="truncate">{ch.label}</span>
              </span>

              {ch.id !== 'global' && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleRemoveRoom(e, ch.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleRemoveRoom(e, ch.id);
                    }
                  }}
                  className="ml-2 text-base leading-none opacity-80 hover:opacity-100"
                  title="Xóa đoạn chat"
                >
                  ×
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ChannelList;
