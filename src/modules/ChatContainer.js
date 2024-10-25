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
  const unsubscribe = ref(null);

  // Helper function to check if the message contains an image link
  const isImage = (messageText) => {
    const trimmedMessage = messageText.trim();
    const imageRegex = /\.(gif|jpg|jpeg|tiff|png)$/i;  
    return imageRegex.test(trimmedMessage);
  };

  const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value;
  };

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      isSidebarOpen.value = false;
    }
  });

  onMounted(() => {
    const savedConversations = JSON.parse(localStorage.getItem('conversations')) || ['public'];
    conversations.value = savedConversations;
    activeConversation.value = savedConversations.includes('public') ? 'public' : savedConversations[0];
    activeTab.value = activeConversation.value;
    fetchMessages(activeConversation.value);
  });

  const saveConversations = () => {
    localStorage.setItem('conversations', JSON.stringify(conversations.value));
  };

  const getChatRoomId = (conversation) => {
    return conversation === 'public' ? 'public_chat' : `private_${[username, conversation].sort().join('_')}`;
  };

  const unsubscribeFromMessages = () => {
    if (unsubscribe.value) {
      unsubscribe.value();
      unsubscribe.value = null;
    }
  };

  // Mark messages as seen
  const markMessagesAsSeen = async (newMessages) => {
    if (activeConversation.value === 'public') return;

    const unseenMessages = newMessages.filter(
      (msg) => msg.sender !== username && (!msg.seenBy || !msg.seenBy.includes(username))
    );

    const chatRoomId = getChatRoomId(activeConversation.value);

    for (const message of unseenMessages) {
      const messageRef = doc(db, chatRoomId, message.id);
      await updateDoc(messageRef, {
        seenBy: [...(message.seenBy || []), username],
      });
    }
  };

  const fetchMessages = (conversation) => {
    unsubscribeFromMessages();
    messages.value = [];
    const chatRoomId = getChatRoomId(conversation);
    const messagesRef = collection(db, chatRoomId);

    unsubscribe.value = onSnapshot(query(messagesRef, orderBy('timestamp')), (snapshot) => {
      const newMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        seenBy: doc.data().seenBy || [], // Ensure seenBy is an array
      }));

      messages.value = newMessages;
      scrollToBottom();

      if (conversation !== 'public') {
        markMessagesAsSeen(newMessages);
      }
    });
  };

  watch(conversations, saveConversations, { deep: true });

  watch(activeConversation, (newConversation) => {
    fetchMessages(newConversation);
    activeTab.value = newConversation === 'public' ? 'public' : newConversation;
  });

  const sendMessage = async () => {
    if (newMessage.value.trim()) {
      const chatRoomId = getChatRoomId(activeConversation.value);
      const messagesRef = collection(db, chatRoomId);

      await addDoc(messagesRef, {
        text: newMessage.value,
        sender: username,
        timestamp: Date.now(),
        seenBy: []  // Initialize with an empty array
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

  const startEditing = (message) => {
    isEditing.value = true;
    editMessageId.value = message.id;
    editMessageText.value = message.text;
  };

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

  const cancelEdit = () => {
    isEditing.value = false;
    editMessageId.value = null;
    editMessageText.value = '';
  };

  const deleteMessage = async (id) => {
    const chatRoomId = getChatRoomId(activeConversation.value);
    const messageDocRef = doc(db, chatRoomId, id);

    await deleteDoc(messageDocRef);
  };

  const selectUser = (selectedUser) => {
    if (!conversations.value.includes(selectedUser)) {
      conversations.value.push(selectedUser);
    }
    setActiveConversation(selectedUser);
  };

  const setActiveConversation = (conversation) => {
    activeConversation.value = conversation;
    activeTab.value = conversation;
  };

  const closeConversation = (conversation) => {
    conversations.value = conversations.value.filter(c => c !== conversation);
    if (activeConversation.value === conversation) {
      setActiveConversation('public');
    }
  };

  const scrollToBottom = async () => {
    await nextTick();
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  };

  return {
    messages,
    newMessage,
    messageContainer,
    isEditing,
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
    isImage 
  };
}
