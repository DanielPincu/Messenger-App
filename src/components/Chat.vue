<template>
  <v-container class="mt-10" max-width="600">
    <v-card class="elevation-12">
      <!-- Header -->
      <v-card-title class="d-flex justify-space-between" :class="chatWith ? 'primary' : 'indigo'">
        <span class="white--text text-h6">{{ chatWith ? `Chat with ${chatWith}` : 'Public Chat Room' }}</span>
        <v-btn v-if="chatWith" @click="switchToPublicChat" color="white" text>
          Return to Public Chat
        </v-btn>
      </v-card-title>

      <!-- Messages -->
      <v-card-text>
        <v-container class="py-4" fluid>
          <v-row>
            <v-col v-for="message in messages" :key="message.id" :class="message.sender === username ? 'text-right' : 'text-left'" cols="12">
              <v-chip :color="message.sender === username ? 'primary' : 'grey lighten-2'" class="ma-2" :text-color="message.sender === username ? 'white' : 'black'">
                <strong>{{ message.sender }}:</strong>
                {{ message.text }}
              </v-chip>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <!-- Input -->
      <v-divider></v-divider>
      <v-card-actions class="px-4 py-3">
        <v-text-field
          v-model="newMessage"
          label="Type a message..."
          @keyup.enter="sendMessage"
          hide-details
          single-line
          class="flex-grow-1"
        ></v-text-field>
        <v-btn @click="sendMessage" color="primary">
          Send
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

const props = defineProps(['username', 'chatWith']);
const emit = defineEmits(['switchToPublic']);
const messages = ref([]);
const newMessage = ref('');
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
.text-right {
  text-align: right;
}

.text-left {
  text-align: left;
}

.flex-grow-1 {
  flex-grow: 1;
}
</style>
