import { useNavigate } from 'react-router-dom';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';
import { disconnectSocket } from '../../socket/client';

function ChatHeader() {
  const currentRoom = useChatStore((s) => s.currentRoom);
  const currentDMUser = useChatStore((s) => s.currentDMUser);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const connectionStatus = useChatStore((s) => s.connectionStatus);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  const statusLabel =
    connectionStatus === 'connected'
      ? 'Connected'
      : connectionStatus === 'connecting'
        ? 'Connecting...'
        : connectionStatus === 'reconnecting'
          ? 'Reconnecting...'
          : connectionStatus === 'offline'
            ? 'Offline'
            : '';

  const handleLogout = () => {
    disconnectSocket();
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <span className="text-xl text-textSecondary">{currentDMUser ? '@' : '#'}</span>
        <span className="font-semibold">{currentDMUser ? currentDMUser.username : currentRoom}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-textSecondary">
        <span>{onlineUsers.length} online</span>
        {statusLabel && <span>{statusLabel}</span>}
        <button
          type="button"
          onClick={handleLogout}
          className="rounded bg-inputBg px-3 py-1.5 text-xs font-semibold text-textPrimary hover:opacity-90"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;


