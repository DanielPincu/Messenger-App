<template>
  <div class="chat-container">
    <h2 v-if="chatWith">Chatting privately with {{ chatWith }}</h2>
    <h2 v-else>Public Chat Room</h2>

    <!-- Return to Public Chat Button -->
    <button v-if="chatWith" @click="switchToPublicChat" class="public-chat-button">
      Return to Public Chat
    </button>

    <div class="messages" ref="messageContainer">
      <div v-for="message in messages" :key="message.id">
        <strong>{{ message.sender }}:</strong> {{ message.text }}
      </div>
    </div>

    <div class="message-input">
      <input v-model="newMessage" placeholder="Type a message..." />
      <button @click="sendMessage">Send</button>
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

<style scoped>
.chat-container {
  max-width: 600px;
  margin: 50px auto;
}

.public-chat-button {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 10px;
  margin-bottom: 10px;
  cursor: pointer;
}

.public-chat-button:hover {
  background-color: #358a68;
}

.messages {
  height: 400px;
  overflow-y: scroll;
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid #ccc;
}

.message-input {
  display: flex;
}

input {
  flex: 1;
  padding: 10px;
}

button {
  padding: 10px;
  background-color: #42b983;
  color: white;
  border: none;
  cursor: pointer;
}
</style>
