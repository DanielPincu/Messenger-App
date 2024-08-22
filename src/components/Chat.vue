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
        :class="{ 'font-bold bg-white': activeTab === 'users' }"
        class="flex-1 text-center p-2"
      >
        Online Users
      </button>
    </div>

    <!-- Main Content Based on Active Tab -->
    <div class="flex-1 p-6 space-y-4 overflow-y-auto max-h-[500px] bg-gray-50" ref="messageContainer">
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
import { ref, watch, onMounted } from 'vue';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import UserList from './UserList.vue';  // Import UserList component

const props = defineProps(['username']);
const messages = ref([]);
const newMessage = ref('');
const messageContainer = ref(null);
const unsubscribe = ref(null);

const activeTab = ref('public');  // Ensure the public chat is the default active tab
const activeConversation = ref('public');  // Manage the currently active conversation
const conversations = ref([]);  // Track all active conversations (tabs)

// Initialize conversations from localStorage on mount
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
  return conversation === 'public'
    ? 'public_chat'
    : `private_${[props.username, conversation].sort().join('_')}`;
};

const unsubscribeFromMessages = () => {
  if (unsubscribe.value) {
    unsubscribe.value();
    unsubscribe.value = null;
  }
};

const fetchMessages = (conversation) => {
  console.log("Fetching messages for conversation:", conversation);
  unsubscribeFromMessages();
  messages.value = [];
  const chatRoomId = getChatRoomId(conversation);
  const messagesRef = collection(db, chatRoomId);

  unsubscribe.value = onSnapshot(query(messagesRef, orderBy('timestamp')), (snapshot) => {
    messages.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
};

watch(conversations, saveConversations, { deep: true });

watch(activeConversation, (newConversation) => {
  console.log("Active conversation changed to:", newConversation);
  fetchMessages(newConversation);
  activeTab.value = newConversation === 'public' ? 'public' : newConversation;
});

const sendMessage = async () => {
  if (newMessage.value.trim()) {
    const chatRoomId = getChatRoomId(activeConversation.value);
    const messagesRef = collection(db, chatRoomId);

    await addDoc(messagesRef, {
      text: newMessage.value,
      sender: props.username,
      timestamp: Date.now(),
    });

    newMessage.value = '';
  }
};

const selectUser = (selectedUser) => {
  console.log("Selected user:", selectedUser);
  if (!conversations.value.includes(selectedUser)) {
    conversations.value.push(selectedUser);  // Add new conversation if it doesn't exist
    console.log("New conversations array:", conversations.value);
  }
  setActiveConversation(selectedUser);  // Set the newly selected user as the active conversation
};

const setActiveConversation = (conversation) => {
  activeConversation.value = conversation;
  activeTab.value = conversation;
  console.log("Set active conversation to:", conversation);
};

const closeConversation = (conversation) => {
  conversations.value = conversations.value.filter(c => c !== conversation);
  if (activeConversation.value === conversation) {
    setActiveConversation('public');
  }
  console.log("Closed conversation:", conversation);
  console.log("Conversations array after closing:", conversations.value);
};
</script>

<style>
/* Custom scrollbar for modern look */
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
