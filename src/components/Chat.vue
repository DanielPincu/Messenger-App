<template>
  <div class="flex flex-col mx-auto mt-10 h-[600px] w-full bg-blue-500 shadow-xl rounded-xl overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 bg-blue-800 rounded-t-xl text-white">
      <h2 class="text-xl font-bold" v-if="localChatWith">Chat with {{ localChatWith }}</h2>
      <h2 class="text-xl font-bold" v-else>Public Chat Room</h2>
      <button
        v-if="localChatWith"
        @click="switchToPublicChat"
        class="bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl transition ease-in-out duration-200 px-10"
      >
        Go back
      </button>
    </div>

    <!-- Tabs -->
    <div class="tabs flex p-2 bg-gray-200">
      <button
        @click="activeTab = 'chat'"
        :class="{ 'font-bold bg-white': activeTab === 'chat' }"
        class="flex-1 text-center p-2"
      >
        Chat
      </button>
      <button
        @click="activeTab = 'users'"
        :class="{ 'font-bold bg-white': activeTab === 'users' }"
        class="flex-1 text-center p-2"
      >
        Online Users
      </button>
    </div>

    <!-- Conditional Rendering Based on Active Tab -->
    <div class="flex-1 p-6 space-y-4 overflow-y-auto max-h-[500px] bg-gray-50" ref="messageContainer">
      <div v-if="activeTab === 'chat'">
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
      <div v-else>
        <UserList :currentUser="username" @selectUser="selectUser" />
      </div>
    </div>

    <!-- Input (only show when chat tab is active) -->
    <div v-if="activeTab === 'chat'" class="flex items-center p-4 rounded-b-xl bg-gray-200">
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
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import UserList from './UserList.vue';

const props = defineProps(['username', 'chatWith']);
const emit = defineEmits(['switchToPublic']);
const messages = ref([]);
const newMessage = ref('');
const messageContainer = ref(null);
const unsubscribe = ref(null);
const activeTab = ref('chat');
const localChatWith = ref(props.chatWith || null); // Manage chatWith locally

const getChatRoomId = () => {
  return localChatWith.value 
    ? `private_${[props.username, localChatWith.value].sort().join('_')}` 
    : 'public_chat';
};

const unsubscribeFromMessages = () => {
  if (unsubscribe.value) {
    unsubscribe.value();
    unsubscribe.value = null;
  }
};

const fetchMessages = () => {
  console.log("Fetching messages for chatWith:", localChatWith.value);
  unsubscribeFromMessages();
  messages.value = [];
  const chatRoomId = getChatRoomId();
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

onMounted(fetchMessages);

watch(() => localChatWith.value, fetchMessages);

const sendMessage = async () => {
  if (newMessage.value.trim()) {
    const chatRoomId = getChatRoomId();
    const messagesRef = collection(db, chatRoomId);

    await addDoc(messagesRef, {
      text: newMessage.value,
      sender: props.username,
      timestamp: Date.now(),
    });

    if (localChatWith.value) {
      const recipientRef = doc(db, 'users', localChatWith.value);
      await updateDoc(recipientRef, {
        unreadFrom: arrayUnion(props.username),
      });
    }

    newMessage.value = '';
  }
};

const selectUser = (selectedUser) => {
  console.log("Selected user:", selectedUser);
  activeTab.value = 'chat';
  localChatWith.value = selectedUser; // Update localChatWith
};

const switchToPublicChat = () => {
  localChatWith.value = null;
  activeTab.value = 'chat';
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
