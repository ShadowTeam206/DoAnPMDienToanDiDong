import { useMemo, useState } from 'react';
import useChatStore from '../../store/chatStore';
import api from '../../api/axios';
import { getSocket } from '../../socket/client';

function FriendsPanel() {
  const friends = useChatStore((s) => s.friends);
  const pendingRequests = useChatStore((s) => s.pendingRequests);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const unreadByUserId = useChatStore((s) => s.unreadByUserId);
  const dmLastMessageAtByUserId = useChatStore((s) => s.dmLastMessageAtByUserId);
  const setDMUser = useChatStore((s) => s.setDMUser);
  const removePendingRequest = useChatStore((s) => s.removePendingRequest);
  const removeFriendByUserId = useChatStore((s) => s.removeFriendByUserId);

  const onlineSet = useMemo(() => new Set(onlineUsers.map((u) => u.userId)), [onlineUsers]);

  const sortedFriends = useMemo(() => {
    const copy = [...friends];
    copy.sort((a, b) => {
      const ta = dmLastMessageAtByUserId[a.userId];
      const tb = dmLastMessageAtByUserId[b.userId];
      const da = ta ? new Date(ta).getTime() : 0;
      const db = tb ? new Date(tb).getTime() : 0;
      if (db !== da) return db - da;
      return (a.username || '').localeCompare(b.username || '');
    });
    return copy;
  }, [friends, dmLastMessageAtByUserId]);

  const [targetUsername, setTargetUsername] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSendRequest = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const username = targetUsername.trim();
    if (!username) {
      setError('Vui lòng nhập username');
      return;
    }

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('friend:request', { username }, (ack) => {
        if (!ack?.ok) {
          setError(ack?.message || 'Gửi lời mời thất bại');
          return;
        }
        setInfo(ack.message || 'Đã gửi lời mời kết bạn');
        setTargetUsername('');
      });
      return;
    }

    try {
      const res = await api.post('/api/friends/requests', { username });
      setInfo(res.data?.message || 'Đã gửi lời mời kết bạn');
      setTargetUsername('');
    } catch (err) {
      setError(err.response?.data?.message || 'Gửi lời mời thất bại');
    }
  };

  const handleAccept = async (requestId) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('friend:accept', { requestId }, (ack) => {
        if (!ack?.ok) {
          setError(ack?.message || 'Chấp nhận lời mời thất bại');
          return;
        }
        removePendingRequest(requestId);
        setInfo(ack.message || 'Đã chấp nhận lời mời');
        setError('');
      });
      return;
    }

    try {
      await api.post(`/api/friends/requests/${requestId}/accept`);
      removePendingRequest(requestId);
      setInfo('Đã chấp nhận lời mời');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Chấp nhận lời mời thất bại');
    }
  };

  const handleReject = async (requestId) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('friend:reject', { requestId }, (ack) => {
        if (!ack?.ok) {
          setError(ack?.message || 'Từ chối lời mời thất bại');
          return;
        }
        removePendingRequest(requestId);
        setInfo(ack.message || 'Đã từ chối lời mời');
        setError('');
      });
      return;
    }

    try {
      await api.post(`/api/friends/requests/${requestId}/reject`);
      removePendingRequest(requestId);
      setInfo('Đã từ chối lời mời');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Từ chối lời mời thất bại');
    }
  };

  const handleUnfriend = async (friendUserId) => {
    const ok = window.confirm('Bạn có chắc muốn hủy kết bạn?');
    if (!ok) return;

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('friend:remove', { friendUserId }, (ack) => {
        if (!ack?.ok) {
          setError(ack?.message || 'Hủy kết bạn thất bại');
          return;
        }
        removeFriendByUserId(friendUserId);
        setInfo(ack.message || 'Đã hủy kết bạn');
        setError('');
      });
      return;
    }

    try {
      await api.delete(`/api/friends/${friendUserId}`);
      removeFriendByUserId(friendUserId);
      setInfo('Đã hủy kết bạn');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Hủy kết bạn thất bại');
    }
  };

  return (
    <div className="h-full flex flex-col border-t border-black/40">
      <div className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-textSecondary">
        Bạn bè
      </div>

      <form className="px-3 pb-2" onSubmit={handleSendRequest}>
        <div className="flex gap-1">
          <input
            value={targetUsername}
            onChange={(e) => setTargetUsername(e.target.value)}
            placeholder="Username để kết bạn"
            className="flex-1 rounded bg-inputBg px-2 py-1.5 text-xs outline-none"
          />
          <button type="submit" className="rounded bg-accent px-2 text-xs font-semibold">
            Add
          </button>
        </div>
      </form>

      {error && <div className="px-3 pb-2 text-[11px] text-red-300">{error}</div>}
      {info && <div className="px-3 pb-2 text-[11px] text-emerald-300">{info}</div>}

      <div className="px-3 pb-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-textSecondary mb-1">
          Lời mời ({pendingRequests.length})
        </div>
        <div className="space-y-1 max-h-28 overflow-y-auto">
          {pendingRequests.map((r) => (
            <div key={r.id} className="rounded bg-[#2b2d31] px-2 py-1.5 text-xs">
              <div className="truncate">{r.senderUsername}</div>
              <div className="mt-1 flex gap-1">
                <button
                  type="button"
                  onClick={() => handleAccept(r.id)}
                  className="rounded bg-emerald-700/70 px-2 py-0.5 text-[10px]"
                >
                  Đồng ý
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(r.id)}
                  className="rounded bg-rose-700/70 px-2 py-0.5 text-[10px]"
                >
                  Từ chối
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-3 pb-2 flex-1 overflow-y-auto">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-textSecondary mb-1">
          Danh sách bạn bè ({sortedFriends.length})
        </div>
        <div className="space-y-1">
          {sortedFriends.map((f) => {
            const isOnline = onlineSet.has(f.userId);
            const unreadCount = unreadByUserId[f.userId] || 0;

            return (
              <div key={f.userId} className="rounded bg-[#2b2d31] px-2 py-1.5 text-xs">
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => setDMUser(f)}
                    className="truncate text-left hover:underline flex items-center gap-1"
                  >
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        isOnline ? 'bg-emerald-400' : 'bg-gray-500'
                      }`}
                    />
                    <span className="truncate">{f.username}</span>
                    {unreadCount > 0 && (
                      <span className="ml-1 inline-flex min-w-4 h-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnfriend(f.userId)}
                    className="text-[10px] text-rose-300 hover:text-rose-200"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FriendsPanel;
