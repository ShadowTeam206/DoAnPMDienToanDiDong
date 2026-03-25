import useChatStore from '../../store/chatStore';

const servers = [
  {
    id: 'global',
    name: 'Global',
    color: 'bg-accent'
  }
];

function ServerBar() {
  const currentRoom = useChatStore((s) => s.currentRoom);
  const setRoom = useChatStore((s) => s.setRoom);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {servers.map((server) => {
        const active = currentRoom === server.id;
        return (
          <button
            key={server.id}
            onClick={() => setRoom(server.id)}
            className="relative group"
          >
            <div
              className={`absolute -left-2 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all ${
                active ? 'h-7 bg-textPrimary' : 'h-0 group-hover:h-4 bg-textSecondary'
              }`}
            />
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-3xl text-lg font-semibold transition-all ${
                active
                  ? `${server.color} text-white rounded-2xl`
                  : 'bg-sidebarAlt text-textSecondary hover:rounded-2xl hover:bg-accentSoft'
              }`}
            >
              G
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default ServerBar;

