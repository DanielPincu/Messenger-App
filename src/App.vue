<template>
  <div id="app" class="bg w-full h-screen bg-blue-100">
    <div v-if="!username" class="flex items-center justify-center h-full">
      <LoginSystem @login="handleLogin" />
    </div>
    <div v-else>
      <div class="bg-white shadow-md p-4 flex justify-between items-center">
        <h2 class="text-xl font-bold text-gray-800">Welcome, {{ displayName }}</h2>
        <div class="flex items-center space-x-4">
          <button 
            @click="logout" 
            class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-300"
          >
            Logout
          </button>
        </div>
      </div>
      <div class="md:flex gap-4">
        <ChatContainer 
          :username="displayName" 
          :chatWith="chatWith" 
          @switchToPublic="switchToPublic" 
          class="w-3/4 p-4"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import LoginSystem from './components/LoginSystem.vue';
import ChatContainer from './components/ChatContainer.vue';
import { App } from './modules/App.js';

// Use the app logic from AppLogic.js
const {
  username,
  displayName,
  chatWith,
  handleLogin,
  switchToPublic,
  logout,
} = App();
</script>
