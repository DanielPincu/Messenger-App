import { ref, watch, onMounted, nextTick } from 'vue';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './Firebase';

// Initialize reactive variables
export function ChatContainer(username) {
  const messages = ref([]);
  const newMessage = ref('');
  const messageContainer = ref(null);
  const isEditing = ref(false);
  const editMessageId = ref(null);
  const editMessageText = ref('');
  const isSidebarOpen = ref(false);
  const activeTab = ref('public');
  const activeConversation = ref('public');
  const conversations = ref([]);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value;
  };

  // Handle window resize for sidebar
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      isSidebarOpen.value = false;
    }
  });

  // Initialize conversations and messages on mount
  onMounted(() => {
    const savedConversations = JSON.parse(localStorage.getItem('conversations')) || ['public'];
    conversations.value = savedConversations;
    activeConversation.value = savedConversations.includes('public') ? 'public' : savedConversations[0];
    activeTab.value = activeConversation.value;
    fetchMessages(activeConversation.value);
  });

  // Save conversations to localStorage
  const saveConversations = () => {
    localStorage.setItem('conversations', JSON.stringify(conversations.value));
  };

  // Get chat room ID based on the conversation type
  const getChatRoomId = (conversation) => {
    return conversation === 'public'
      ? 'public_chat'
      : `private_${[username, conversation].sort().join('_')}`;
  };

  // Unsubscribe from Firestore updates
  const unsubscribeFromMessages = () => {
    if (unsubscribe.value) {
      unsubscribe.value();
      unsubscribe.value = null;
    }
  };

  // Fetch messages for a specific conversation from Firestore
  const fetchMessages = (conversation) => {
    unsubscribeFromMessages();
    messages.value = [];
    const chatRoomId = getChatRoomId(conversation);
    const messagesRef = collection(db, chatRoomId);

    unsubscribe.value = onSnapshot(query(messagesRef, orderBy('timestamp')), (snapshot) => {
      messages.value = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      scrollToBottom();
    });
  };

  // Watch changes in conversations to save them
  watch(conversations, saveConversations, { deep: true });

  // Watch changes in active conversation to fetch new messages
  watch(activeConversation, (newConversation) => {
    fetchMessages(newConversation);
    activeTab.value = newConversation === 'public' ? 'public' : newConversation;
  });

  // Send a new message to Firestore
  const sendMessage = async () => {
    if (newMessage.value.trim()) {
      const chatRoomId = getChatRoomId(activeConversation.value);
      const messagesRef = collection(db, chatRoomId);

      await addDoc(messagesRef, {
        text: newMessage.value,
        sender: username,
        timestamp: Date.now(),
      });

      if (activeConversation.value !== 'public') {
        const recipient = activeConversation.value;
        const recipientDocRef = doc(db, 'users', recipient);

        const recipientDoc = await getDoc(recipientDocRef);
        if (recipientDoc.exists()) {
          const recipientData = recipientDoc.data();
          const unreadFrom = recipientData.unreadFrom ? recipientData.unreadFrom.split(',') : [];

          if (!unreadFrom.includes(username)) {
            unreadFrom.push(username);
          }

          await updateDoc(recipientDocRef, {
            unreadFrom: unreadFrom.join(',')
          });
        }
      }

      newMessage.value = '';
      scrollToBottom();
    }
  };

  // Start editing a message
  const startEditing = (message) => {
    isEditing.value = true;
    editMessageId.value = message.id;
    editMessageText.value = message.text;
  };

  // Update a message
  const updateMessage = async () => {
    if (editMessageText.value.trim()) {
      const chatRoomId = getChatRoomId(activeConversation.value);
      const messageDocRef = doc(db, chatRoomId, editMessageId.value);

      await updateDoc(messageDocRef, {
        text: editMessageText.value,
      });

      cancelEdit();
    }
  };

  // Cancel editing a message
  const cancelEdit = () => {
    isEditing.value = false;
    editMessageId.value = null;
    editMessageText.value = '';
  };

  // Delete a message
  const deleteMessage = async (id) => {
    const chatRoomId = getChatRoomId(activeConversation.value);
    const messageDocRef = doc(db, chatRoomId, id);

    await deleteDoc(messageDocRef);
  };

  // Select a user to start a private chat
  const selectUser = (selectedUser) => {
    if (!conversations.value.includes(selectedUser)) {
      conversations.value.push(selectedUser);
    }
    setActiveConversation(selectedUser);
  };

  // Set the active conversation and tab
  const setActiveConversation = (conversation) => {
    activeConversation.value = conversation;
    activeTab.value = conversation;
  };

  // Close a conversation
  const closeConversation = (conversation) => {
    conversations.value = conversations.value.filter(c => c !== conversation);
    if (activeConversation.value === conversation) {
      setActiveConversation('public');
    }
  };

  // Scroll to the bottom of the message container
  const scrollToBottom = async () => {
    await nextTick();
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  };

  // Variable to hold Firestore unsubscribe function
  const unsubscribe = ref(null);

  return {
    messages,
    newMessage,
    messageContainer,
    isEditing,
    editMessageId,
    editMessageText,
    isSidebarOpen,
    activeTab,
    activeConversation,
    conversations,
    toggleSidebar,
    sendMessage,
    startEditing,
    updateMessage,
    cancelEdit,
    deleteMessage,
    selectUser,
    setActiveConversation,
    closeConversation,
    scrollToBottom,
  };
}
