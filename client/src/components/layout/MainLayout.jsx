import ServerBar from '../sidebar/ServerBar';
import ChannelList from '../sidebar/ChannelList';
import FriendsPanel from '../sidebar/FriendsPanel';

function MainLayout({ header, children }) {
  return (
    <div className="h-screen w-screen flex bg-background">
      <div className="w-[72px] bg-sidebar flex flex-col items-center py-3 gap-2 border-r border-black/40">
        <ServerBar />
      </div>
      <div className="w-72 bg-sidebarAlt flex flex-col border-r border-black/40 min-h-0">
        <div className="flex-1 min-h-0 overflow-hidden bg-sidebarAlt">
          <ChannelList />
        </div>
        <div className="h-[45%] min-h-[260px] min-h-0 overflow-hidden border-t border-black/40 bg-sidebarAlt">
          <FriendsPanel />
        </div>
      </div>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="h-12 shrink-0 px-4 flex items-center border-b border-black/40 bg-[#2b2d31]">
          {header}
        </div>
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

export default MainLayout;

