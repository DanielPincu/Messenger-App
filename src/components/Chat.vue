<template>
  <div class="flex flex-col container mx-auto mt-10 h-[600px] w-full bg-blue-500 shadow-xl rounded-xl overflow-hidden">
    
    <!-- Header -->
    <div class="flex items-center justify-between p-4 bg-blue-800 rounded-t-xl text-white">
      <h2 class="text-xl font-bold">
        <template v-if="activeTab === 'users'">
          Online Users
        </template>
        <template v-else-if="activeConversation !== 'public'">
          Chat with {{ activeConversation }}
        </template>
        <template v-else>
          Public Chat Room
        </template>
      </h2>
      <button
        v-if="activeTab !== 'users' && activeConversation !== 'public'"
        @click="closeConversation(activeConversation)"
        class="bg-red-500 hover:bg-red-400 text-white rounded-xl transition ease-in-out duration-200 px-4 py-1"
      >
        Close Chat
      </button>
    </div>

    <!-- Tabs -->
    <div class="tabs flex p-2 bg-gray-200">
      <button
        @click="setActiveConversation('public')"
        :class="{ 'font-bold bg-white': activeTab === 'public' }"
        class="flex-1 text-center p-2"
      >
        Public Chat
      </button>
      <button
        v-for="conversation in conversations.filter(c => c !== 'public')"
        :key="conversation"
        @click="setActiveConversation(conversation)"
        :class="{ 'font-bold bg-white': activeTab === conversation }"
        class="flex-1 text-center p-2"
      >
        Chat with {{ conversation }}
      </button>
      <button
        @click="activeTab = 'users'"
        :class="{ 'font-bold bg-white': activeTab === 'users', 'text-red-500': hasUnreadMessages }"
        class="flex-1 text-center p-2"
      >
        Online Users
      </button>
    </div>

    <!-- Main Content Based on Active Tab -->
    <div class="flex-1 p-6 space-y-4 overflow-y-auto max-h-[500px] bg-gray-50 message-container" ref="messageContainer">
      <!-- Public Chat Messages -->
      <div v-if="activeTab === 'public'">
        <div v-for="message in messages" :key="message.id" class="flex">
          <div
            :class="{
              'ml-auto bg-indigo-600 text-white': message.sender === username,
              'mr-auto bg-gray-300 text-gray-800': message.sender !== username
            }"
            class="max-w-xs p-3 rounded-xl shadow-md transition transform hover:scale-105"
          >
            <strong class="block font-semibold">{{ message.sender }}:</strong>
            <p>{{ message.text }}</p>
          </div>
        </div>
      </div>

      <!-- Private Chat Messages -->
      <div v-else-if="activeTab !== 'users'">
        <div v-for="message in messages" :key="message.id" class="flex">
          <div
            :class="{
              'ml-auto bg-indigo-600 text-white': message.sender === username,
              'mr-auto bg-gray-300 text-gray-800': message.sender !== username
            }"
            class="max-w-xs p-3 rounded-xl shadow-md transition transform hover:scale-105"
          >
            <strong class="block font-semibold">{{ message.sender }}:</strong>
            <p>{{ message.text }}</p>
          </div>
        </div>
      </div>

      <!-- Online Users -->
      <div v-else>
        <UserList :currentUser="username" @selectUser="selectUser" />
      </div>
    </div>

    <!-- Input for Sending Messages (only in Chat Tab) -->
    <div v-if="activeTab !== 'users'" class="flex items-center p-4 rounded-b-xl bg-gray-200">
      <input
        v-model="newMessage"
        @keyup.enter="sendMessage"
        placeholder="Type a message..."
        class="flex-1 px-4 py-2 mr-2 w-10 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ease-in-out duration-200"
      />
      <button
        @click="sendMessage"
        class="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-full shadow-lg transition ease-in-out duration-200"
      >
        Send
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import UserList from './UserList.vue';  // Import UserList component

const props = defineProps(['username']);  // Receive username as a prop
const messages = ref([]);  // Reactive variable to store messages
const newMessage = ref('');  // Reactive variable to hold the new message input
const messageContainer = ref(null);  // Reference to the message container for auto-scroll
const unsubscribe = ref(null);  // Store the unsubscribe function for Firestore listener

const activeTab = ref('public');  // Default active tab is the public chat
const activeConversation = ref('public');  // Default active conversation is the public chat
const conversations = ref([]);  // Store all active conversations (including public chat)
const hasUnreadMessages = ref(false); // Track if there are unread messages

// Initialize conversations from localStorage when the component mounts
onMounted(() => {
  const savedConversations = JSON.parse(localStorage.getItem('conversations')) || ['public'];
  conversations.value = savedConversations;  // Load saved conversations
  activeConversation.value = savedConversations.includes('public') ? 'public' : savedConversations[0];  // Set active conversation
  activeTab.value = activeConversation.value;  // Set active tab to match the conversation
  fetchMessages(activeConversation.value);  // Fetch messages for the active conversation
  monitorUnreadMessages(); // Start monitoring unread messages
});

// Save conversations to localStorage whenever they change
const saveConversations = () => {
  localStorage.setItem('conversations', JSON.stringify(conversations.value));
};

// Generate the chat room ID based on whether it's public or private
const getChatRoomId = (conversation) => {
  return conversation === 'public'
    ? 'public_chat'
    : `private_${[props.username, conversation].sort().join('_')}`;
};

// Unsubscribe from the Firestore listener if it's active
const unsubscribeFromMessages = () => {
  if (unsubscribe.value) {
    unsubscribe.value();  // Unsubscribe from Firestore
    unsubscribe.value = null;  // Clear the unsubscribe function
  }
};

// Fetch messages from Firestore for the active conversation
const fetchMessages = (conversation) => {
  unsubscribeFromMessages();  // Unsubscribe from any previous listeners
  messages.value = [];  // Clear current messages
  const chatRoomId = getChatRoomId(conversation);  // Get chat room ID
  const messagesRef = collection(db, chatRoomId);

  unsubscribe.value = onSnapshot(query(messagesRef, orderBy('timestamp')), (snapshot) => {
    messages.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    scrollToBottom();  // Scroll to the latest message
  });
};

// Watch for changes in conversations and save them
watch(conversations, saveConversations, { deep: true });

// Watch for changes in the active conversation and fetch messages
watch(activeConversation, (newConversation) => {
  fetchMessages(newConversation);  // Fetch messages for the new active conversation
  activeTab.value = newConversation === 'public' ? 'public' : newConversation;  // Update the active tab
});

// Send a new message to Firestore
const sendMessage = async () => {
  if (newMessage.value.trim()) {
    const chatRoomId = getChatRoomId(activeConversation.value);  // Get chat room ID
    const messagesRef = collection(db, chatRoomId);

    await addDoc(messagesRef, {
      text: newMessage.value,
      sender: props.username,
      timestamp: Date.now(),
    });

    // Notify the recipient if it's a private message
    if (activeConversation.value !== 'public') {
      const recipient = activeConversation.value;
      const recipientDocRef = doc(db, 'users', recipient);

      const recipientDoc = await getDoc(recipientDocRef);
      if (recipientDoc.exists()) {
        const recipientData = recipientDoc.data();
        const unreadFrom = recipientData.unreadFrom ? recipientData.unreadFrom.split(',') : [];
        
        // Add sender to recipient's unread messages list if not already there
        if (!unreadFrom.includes(props.username)) {
          unreadFrom.push(props.username);
        }

        await updateDoc(recipientDocRef, {
          unreadFrom: unreadFrom.join(',')
        });
      }
    }

    newMessage.value = '';  // Clear the input after sending
    scrollToBottom();  // Scroll to the bottom after sending a message
  }
};

// Select a user to start a private chat
const selectUser = (selectedUser) => {
  if (!conversations.value.includes(selectedUser)) {
    conversations.value.push(selectedUser);  // Add the user to the conversations list
  }
  setActiveConversation(selectedUser);  // Set the active conversation to the selected user
};

// Set the active conversation and tab
const setActiveConversation = (conversation) => {
  activeConversation.value = conversation;
  activeTab.value = conversation;
};

// Close a conversation and switch to the public chat
const closeConversation = (conversation) => {
  conversations.value = conversations.value.filter(c => c !== conversation);  // Remove the conversation
  if (activeConversation.value === conversation) {
    setActiveConversation('public');  // Switch to public chat if the closed conversation was active
  }
};

// Scroll to the bottom of the message container
const scrollToBottom = async () => {
  await nextTick();  // Wait until the DOM is updated
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
};

// Monitor unread messages for the current user
const monitorUnreadMessages = () => {
  const q = query(collection(db, 'users'), where('online', '==', true));
  onSnapshot(q, (snapshot) => {
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.username === props.username) {
        const unreadFrom = data.unreadFrom ? data.unreadFrom.split(',') : [];
        hasUnreadMessages.value = unreadFrom.length > 0;
      }
    });
  });
};
</script>

<style>

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
