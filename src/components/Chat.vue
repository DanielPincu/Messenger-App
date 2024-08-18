<template>
  <div class="flex flex-col max-w-2xl mx-auto mt-10 bg-white shadow-xl rounded-lg overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 bg-gray-800 text-white">
      <h2 class="text-xl font-bold" v-if="chatWith">Chat with {{ chatWith }}</h2>
      <h2 class="text-xl font-bold" v-else>Public Chat Room</h2>
      <button
        v-if="chatWith"
        @click="switchToPublicChat"
        class="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition ease-in-out duration-200"
      >
        Return to Public Chat
      </button>
    </div>

    <!-- Messages -->
    <div class="flex-1 p-6 space-y-4 overflow-y-auto bg-gray-50" ref="messageContainer" style="max-height: 500px;">
      <div v-for="message in messages" :key="message.id" class="flex">
        <div
          :class="{
            'ml-auto bg-indigo-600 text-white': message.sender === username,
            'mr-auto bg-gray-300 text-gray-800': message.sender !== username
          }"
          class="max-w-xs p-3 rounded-lg shadow-md transition transform hover:scale-105"
        >
          <strong class="block font-semibold">{{ message.sender }}:</strong>
          <p>{{ message.text }}</p>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="flex items-center p-4 bg-gray-200">
      <input
        v-model="newMessage"
        @keyup.enter="sendMessage"
        placeholder="Type a message..."
        class="flex-1 px-4 py-2 mr-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ease-in-out duration-200"
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

const props = defineProps(['username', 'chatWith']);
const emit = defineEmits(['switchToPublic']);
const messages = ref([]);
const newMessage = ref('');
const messageContainer = ref(null);
const unsubscribe = ref(null);

const getChatRoomId = () => {
  return props.chatWith 
    ? `private_${[props.username, props.chatWith].sort().join('_')}` 
    : 'public_chat';
};

const unsubscribeFromMessages = () => {
  if (unsubscribe.value) {
    unsubscribe.value();
    unsubscribe.value = null;
  }
};

const fetchMessages = () => {
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

watch(() => props.chatWith, fetchMessages);

const sendMessage = async () => {
  if (newMessage.value.trim()) {
    const chatRoomId = getChatRoomId();
    const messagesRef = collection(db, chatRoomId);

    await addDoc(messagesRef, {
      text: newMessage.value,
      sender: props.username,
      timestamp: Date.now(),
    });

    if (props.chatWith) {
      const recipientRef = doc(db, 'users', props.chatWith);
      await updateDoc(recipientRef, {
        unreadFrom: arrayUnion(props.username),
      });
    }

    newMessage.value = '';
  }
};

const switchToPublicChat = () => {
  emit('switchToPublic');
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
