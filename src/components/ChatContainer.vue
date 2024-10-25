<template>
  <div class="flex flex-col md:flex-row container mx-auto mt-10 h-[80vh] w-full bg-cyan-400 shadow-xl border-cyan-600 border-2 rounded-xl overflow-hidden">

    <!-- Sidebar for Online Users -->
    <div :class="['md:flex md:flex-col md:w-64', { 'hidden': !isSidebarOpen, 'absolute top-0 left-0 h-full w-full bg-cyan-400 z-50': isSidebarOpen }]">
      <img class="p-2 w-full" src="../assets/logo.png" alt="">
      <div class="flex justify-center">
        <button @click="toggleSidebar" class="md:hidden bg-red-500 rounded-lg px-3 ml-3 text-white">
          CLOSE
        </button>
      </div>
      <div class="flex-1 p-4 bg-cyan-300 border-l-[1px] border-cyan-600 rounded-l-xl mr-0 mt-[54px] overflow-y-auto">
        <OnlineUsers :currentUser="username" :currentChatUser="activeConversation" @selectUser="selectUser" @closeSidebar="toggleSidebar" />
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 h-full flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 bg-cyan-500 border-cyan-600 border-t-2 border-l-2 rounded-t-xl text-white">
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
      <div class="tabs flex p-4 bg-cyan-300 border-l-2 border-cyan-600">
        <button
          @click="setActiveConversation('public')"
          :class="{ 'font-bold bg-cyan-400 rounded-lg': activeTab === 'public' }"
          class="flex-1 text-center border-2 border-cyan-600 rounded-lg p-2 mx-2"
        >
          <span>Public <span class="hidden md:inline-block">Chat</span></span>
        </button>
        <button
          v-for="conversation in conversations.filter(c => c !== 'public')"
          :key="conversation"
          @click="setActiveConversation(conversation)"
          :class="{ 'font-bold bg-cyan-400 rounded-lg': activeTab === conversation }"
          class="flex-1 text-center border-2 border-cyan-600 rounded-lg p-2 mx-2"
        >
          <span class="hidden md:inline-block">Chat with</span> <span>{{ conversation }}</span>
        </button>
      </div>

      <!-- Main Content Based on Active Tab -->
      <div class="flex-1 p-6 space-y-4 overflow-y-auto bg-cyan-100 border-cyan-600 border-l-2 message-container" ref="messageContainer">
        <!-- Public Chat Messages -->
        <div v-if="activeTab === 'public'">
          <div v-for="message in messages" :key="message.id" class="flex flex-col mb-4">
            <div
              :class="{
                'ml-auto bg-cyan-500 text-white': message.sender === username,
                'mr-auto bg-cyan-300 text-gray-800': message.sender !== username
              }"
              class="p-3 rounded-xl shadow-md"
            >
              <span class="block font-semibold">{{ message.sender }}:</span>

              <!-- Check if the message is an image link -->
              <div v-if="isImage(message.text)">
                <img :src="message.text" class="rounded-md w-64" alt="Image">
              </div>
              <div v-else>
                <p>{{ message.text }}</p>
              </div>

            
            </div>
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
                'ml-auto bg-cyan-500 text-slate-50 w-3/4': message.sender === username,
                'mr-auto bg-cyan-500 text-gray-900 w-3/4': message.sender !== username
              }"
              class="max-w-xs p-3 rounded-xl shadow-md"
            >
              <span class="block font-semibold">{{ message.sender }}:</span>

              <div v-if="isImage(message.text)">
                <img :src="message.text" class="rounded-md max-w-full h-auto" alt="Image">
              </div>
              <div v-else>
                <p>{{ message.text }}</p>
              </div>
            </div>
            <div v-if="message.sender === username" class="flex items-center justify-end">
              <span v-if="message.sender === username && Array.isArray(message.seenBy) && message.seenBy.includes(activeConversation)" class="text-xs text-cyan-600">
                Seen <span class="hidden md:inline-block">at {{ new Date(message.timestamp).toLocaleString() }}</span>
              </span>
              <button @click="startEditing(message)" class="text-cyan-500 hover:text-cyan-500 px-2">Edit</button>
              <button @click="deleteMessage(message.id)" class="text-red-500 hover:text-red-700">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Input for Sending Messages -->
      <div v-if="activeTab !== 'users'" class="flex items-baseline p-4 border-l-2 rounded-r-lg rounded-t-none border-cyan-600 bg-cyan-300">
        <GifHandler class="hidden md:block" @gifSelected="handleGifSelected" ref="gifHandler" />
        <input
          ref="messageInput"
          v-model="newMessage"
          @keyup.enter="sendMessage"
          placeholder="Type a message..."
          class="flex-1 px-4 py-2 w-1/2 mr-2 rounded-full md:rounded-l-none md:rounded-r-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-600 transition ease-in-out duration-200"
        />
        <button
          @click="sendMessage"
          class="fas fa-paper-plane px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-full shadow-lg transition ease-in-out duration-200"
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
import { ChatContainer } from '../modules/ChatContainer.js';
import OnlineUsers from './OnlineUsers.vue';
import GifHandler from './GifHandler.vue';

const props = defineProps(['username']);

const {
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
} = ChatContainer(props.username);

const handleGifSelected = (gifUrl) => {
  newMessage.value = gifUrl; 
};
</script>