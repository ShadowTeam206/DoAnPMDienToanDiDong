import { create } from 'zustand';

const INITIAL_CHANNELS = [{ id: 'global', label: 'global-chat' }];
const PINNED_STORAGE_KEY = 'chat_pinned_messages';

function loadPinnedFromStorage() {
  try {
    const raw = localStorage.getItem(PINNED_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function savePinnedToStorage(value) {
  try {
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(value || {}));
  } catch {
    // ignore storage errors
  }
}

const useChatStore = create((set, get) => ({
  channels: INITIAL_CHANNELS,
  currentRoom: 'global',
  currentDMUser: null,
  messagesByRoom: {},
  onlineUsers: [],
  connectionStatus: 'idle',
  friends: [],
  pendingRequests: [],
  unreadByUserId: {},
  dmLastMessageAtByUserId: {},
  dmTypingByUserId: {},
  replyDraft: null,
  pinnedByConversation: loadPinnedFromStorage(),

  setChannels: (channels) => {
    const normalized = Array.isArray(channels)
      ? [{ id: 'global', label: 'global-chat' }, ...channels.filter((c) => c?.id && c.id !== 'global')]
      : INITIAL_CHANNELS;

    const current = get().currentRoom;
    const existsCurrent = normalized.some((c) => c.id === current);

    set({ channels: normalized, currentRoom: existsCurrent ? current : 'global' });
  },

  setRoom: (room) => {
    if (!room) return;
    set({ currentRoom: room, currentDMUser: null, replyDraft: null });
  },

  setDMUser: (user) => {
    if (!user?.userId) return;
    set((state) => ({
      currentDMUser: user,
      replyDraft: null,
      unreadByUserId: {
        ...state.unreadByUserId,
        [user.userId]: 0
      },
      dmTypingByUserId: {
        ...state.dmTypingByUserId,
        [user.userId]: false
      }
    }));
  },

  setReplyDraft: (replyDraft) => set({ replyDraft }),
  clearReplyDraft: () => set({ replyDraft: null }),

  setPinnedMessageForConversation: (conversationKey, message) => {
    if (!conversationKey) return;
    set((state) => {
      const nextPinned = {
        ...state.pinnedByConversation,
        [conversationKey]: message || null
      };
      savePinnedToStorage(nextPinned);
      return { pinnedByConversation: nextPinned };
    });
  },

  addRoomLocal: (room) => {
    if (!room?.id) return;
    set((state) => {
      if (state.channels.some((c) => c.id === room.id)) return state;
      return { channels: [...state.channels, room], currentRoom: room.id, currentDMUser: null, replyDraft: null };
    });
  },

  removeRoom: (roomId) => {
    if (!roomId || roomId === 'global') return;

    set((state) => {
      const nextChannels = state.channels.filter((ch) => ch.id !== roomId);
      const nextMessagesByRoom = { ...state.messagesByRoom };
      delete nextMessagesByRoom[roomId];

      return {
        channels: nextChannels,
        messagesByRoom: nextMessagesByRoom,
        currentRoom: state.currentRoom === roomId ? 'global' : state.currentRoom,
        replyDraft: state.currentRoom === roomId ? null : state.replyDraft
      };
    });
  },

  setMessagesForRoom: (room, messages) => {
    set((state) => ({
      messagesByRoom: {
        ...state.messagesByRoom,
        [room]: messages
      }
    }));
  },

  appendMessage: (room, message) => {
    set((state) => {
      const existing = state.messagesByRoom[room] || [];
      if (message.id != null && existing.some((m) => m.id === message.id)) return state;

      return {
        messagesByRoom: {
          ...state.messagesByRoom,
          [room]: [...existing, message]
        }
      };
    });
  },

  updateMessageInRoom: (room, messageId, patch) => {
    if (!room || !messageId) return;
    set((state) => ({
      messagesByRoom: {
        ...state.messagesByRoom,
        [room]: (state.messagesByRoom[room] || []).map((m) =>
          m.id === messageId
            ? {
                ...m,
                ...patch
              }
            : m
        )
      }
    }));
  },

  setFriends: (friends) => {
    set({ friends: Array.isArray(friends) ? friends : [] });
  },

  addFriend: (friend) => {
    if (!friend?.userId) return;
    set((state) => {
      if (state.friends.some((f) => f.userId === friend.userId)) return state;
      return { friends: [...state.friends, friend] };
    });
  },

  setPendingRequests: (requests) => {
    set({ pendingRequests: Array.isArray(requests) ? requests : [] });
  },

  addPendingRequest: (request) => {
    if (!request?.id) return;
    set((state) => {
      if (state.pendingRequests.some((r) => r.id === request.id)) return state;
      return { pendingRequests: [request, ...state.pendingRequests] };
    });
  },

  removePendingRequest: (requestId) => {
    set((state) => ({ pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId) }));
  },

  removeFriendByUserId: (userId) => {
    set((state) => {
      const nextFriends = state.friends.filter((f) => f.userId !== userId);
      const shouldResetDM = state.currentDMUser?.userId === userId;
      const nextUnread = { ...state.unreadByUserId };
      delete nextUnread[userId];
      const nextLastMessageAt = { ...state.dmLastMessageAtByUserId };
      delete nextLastMessageAt[userId];
      const nextTyping = { ...state.dmTypingByUserId };
      delete nextTyping[userId];

      return {
        friends: nextFriends,
        currentDMUser: shouldResetDM ? null : state.currentDMUser,
        currentRoom: shouldResetDM ? 'global' : state.currentRoom,
        unreadByUserId: nextUnread,
        dmLastMessageAtByUserId: nextLastMessageAt,
        dmTypingByUserId: nextTyping
      };
    });
  },

  incrementUnreadForUser: (userId) => {
    if (!userId) return;
    set((state) => {
      if (state.currentDMUser?.userId === userId) return state;
      return {
        unreadByUserId: {
          ...state.unreadByUserId,
          [userId]: (state.unreadByUserId[userId] || 0) + 1
        }
      };
    });
  },

  markDmActivity: (userId, timestamp) => {
    if (!userId) return;
    set((state) => ({
      dmLastMessageAtByUserId: {
        ...state.dmLastMessageAtByUserId,
        [userId]: timestamp || new Date().toISOString()
      }
    }));
  },

  setDmTyping: (userId, isTyping) => {
    if (!userId) return;
    set((state) => ({
      dmTypingByUserId: {
        ...state.dmTypingByUserId,
        [userId]: Boolean(isTyping)
      }
    }));
  },

  setConnectionStatus: (status) => {
    set({ connectionStatus: status });
  },

  setOnlineUsers: (users) => {
    set({ onlineUsers: Array.isArray(users) ? users : [] });
  },

  addOnlineUser: ({ userId, username }) => {
    if (!userId) return;
    set((state) => {
      if (state.onlineUsers.some((u) => u.userId === userId)) return state;
      return { onlineUsers: [...state.onlineUsers, { userId, username }] };
    });
  },

  removeOnlineUser: (userId) => {
    if (!userId) return;
    set((state) => ({ onlineUsers: state.onlineUsers.filter((u) => u.userId !== userId) }));
  },

  resetPresence: () => {
    set({ onlineUsers: [], connectionStatus: 'idle' });
  }
}));

export default useChatStore;
