<template>
  <div class="flex flex-col md:flex-row container mx-auto mt-10 h-[550px] md:h-[650px] 2xl:h-[800px] w-full bg-blue-400 shadow-xl border-blue-500 border-t-2 border-l-2 rounded-xl overflow-hidden">
    


    <!-- Sidebar for Online Users -->
    <div :class="['md:flex md:flex-col md:w-64', { 'hidden': !isSidebarOpen, 'absolute top-0 left-0 h-full w-full bg-blue-400 z-50': isSidebarOpen }]">
       <img class="p-2 w-full" src="../assets/logo.png" alt="">
      <div class="flex justify-center">
        <button @click="toggleSidebar" class="md:hidden bg-red-500 rounded-lg px-3 ml-3 text-white">
         CLOSE
        </button>
      </div>
      <div class="flex-1 p-4 bg-blue-300 mr-0 mt-[54px] overflow-y-auto">
        <OnlineUsers :currentUser="username" :currentChatUser="activeConversation" @selectUser="selectUser" @closeSidebar="toggleSidebar" />
      </div>
    </div>



    <!-- Main Content -->
    <div class="flex-1 h-full flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 bg-blue-500 border-blue-500 border-t-2 border-l-2 rounded-t-xl text-white">
        <div class="flex items-center space-x-4">
          <button @click="toggleSidebar" class="md:hidden text-white text-3xl">
            ☰
          </button>
          <h2 class="text-sm md:text-lg font-bold">
            <span v-if="activeTab === 'public'">Public Chat Room</span>
            <span v-else-if="activeTab === 'users'">Online Users</span>
            <span v-else>Chat with {{ activeConversation }}</span>
          </h2>
        </div>
        <button
          v-if="activeTab !== 'public' && activeConversation !== 'public'"
          @click="closeConversation(activeConversation)"
          class="bg-red-500 hover:bg-red-600 text-white rounded-md transition ease-in-out duration-200 px-2 md:px-5"
        >
          Close Chat
        </button>
      </div>



      <!-- Tabs -->
      <div class="tabs flex p-4 bg-blue-300 border-l-2 border-blue-500">
        <button
          @click="setActiveConversation('public')"
          :class="{ 'font-bold bg-blue-400 rounded-lg': activeTab === 'public' }"
          class="flex-1 text-center border-2 border-blue-500 rounded-lg p-2 mx-2"
        >
          <span>Public <span class="hidden md:inline-block">Chat</span></span>
        </button>
        <button
          v-for="conversation in conversations.filter(c => c !== 'public')"
          :key="conversation"
          @click="setActiveConversation(conversation)"
          :class="{ 'font-bold bg-blue-400 rounded-lg': activeTab === conversation }"
          class="flex-1 text-center border-2 border-blue-500 rounded-lg p-2 mx-2"
        >
          <span class="hidden md:inline-block">Chat with</span> {{ conversation }}
        </button>
      </div>



      <!-- Main Content Based on Active Tab -->
      <div class="flex-1 p-6 space-y-4 overflow-y-auto bg-blue-100 border-blue-500 border-l-2 message-container" ref="messageContainer">
        <!-- Public Chat Messages -->
        <div v-if="activeTab === 'public'">
          <div v-for="message in messages" :key="message.id" class="flex flex-col mb-4">
            <div
              :class="{
                'ml-auto bg-indigo-500 text-white': message.sender === username,
                'mr-auto bg-indigo-300 text-gray-800': message.sender !== username
              }"
              class="p-3 rounded-xl shadow-md"
            >
              <strong class="block font-semibold">{{ message.sender }}:</strong>
              <p>{{ message.text }}</p>
            </div>
            <!-- Edit and Delete buttons -->
            <div v-if="message.sender === username" class="flex justify-end">
              <button @click="startEditing(message)" class="text-blue-500 hover:text-blue-700 px-2">Edit</button>
              <button @click="deleteMessage(message.id)" class="text-red-500 hover:text-red-700">Delete</button>
            </div>
          </div>
        </div>



        <!-- Private Chat Messages -->
        <div v-else-if="activeTab !== 'users'">
          <div v-for="message in messages" :key="message.id" class="flex flex-col mb-4">
            <div
              :class="{
                'ml-auto bg-indigo-500 text-white': message.sender === username,
                'mr-auto bg-indigo-300 text-gray-800': message.sender !== username
              }"
              class="max-w-xs p-3 rounded-xl shadow-md"
            >
              <strong class="block font-semibold">{{ message.sender }}:</strong>
              <p>{{ message.text }}</p>
            </div>
            <!-- Edit and Delete buttons -->
            <div v-if="message.sender === username" class="flex justify-end">
              <button @click="startEditing(message)" class="text-blue-500 hover:text-blue-700 px-2">Edit</button>
              <button @click="deleteMessage(message.id)" class="text-red-500 hover:text-red-700">Delete</button>
            </div>
          </div>
        </div>
      </div>

      

      <!-- Input for Sending Messages -->
      <div v-if="activeTab !== 'users'" class="flex items-center p-4 border-l-2 border-blue-500  bg-blue-200">
        <input
          ref="messageInput"
          v-model="newMessage"
          @keyup.enter="sendMessage"
          placeholder="Type a message..."
          class="flex-1 px-4 py-2 w-full mr-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ease-in-out duration-200"
        />
        <button
          @click="sendMessage"
          class="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-full shadow-lg transition ease-in-out duration-200"
        >
          Send
        </button>
      </div>

      <!-- Edit Message Modal -->
      <div v-if="isEditing" class="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
        <div class="bg-white p-4 rounded-xl shadow-lg">
          <h3 class="text-lg font-semibold mb-2">Edit Message</h3>
          <textarea
            v-model="editMessageText"
            @keyup.enter="updateMessage"
            class="w-full p-2 border border-gray-300 rounded-md"
            rows="4" 
          ></textarea>
          <div class="mt-2 flex justify-end">
            <button @click="updateMessage" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Update</button>
            <button @click="cancelEdit" class="ml-2 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import OnlineUsers from './OnlineUsers.vue';

// Props
const props = defineProps(['username']);

// Reactive variables
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
    : `private_${[props.username, conversation].sort().join('_')}`;
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
      sender: props.username,
      timestamp: Date.now(),
    });

    if (activeConversation.value !== 'public') {
      const recipient = activeConversation.value;
      const recipientDocRef = doc(db, 'users', recipient);

      const recipientDoc = await getDoc(recipientDocRef);
      if (recipientDoc.exists()) {
        const recipientData = recipientDoc.data();
        const unreadFrom = recipientData.unreadFrom ? recipientData.unreadFrom.split(',') : [];

        if (!unreadFrom.includes(props.username)) {
          unreadFrom.push(props.username);
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

</script>

