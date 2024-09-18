<template>
  <div class="w-full p-5 bg-blue-200 rounded-xl">
    <h3 class="text-lg font-semibold text-green-700 text-center mb-4">Online Users</h3>
    <ul>
      <li
        v-for="user in filteredUsers"
        :key="user.username"
        @click="selectUser(user)"
        :class="[
          'p-2 bg-green-100 mb-2 font-bold hover:bg-green-400 duration-200 rounded-md cursor-pointer',
          shouldHighlightUser(user.username) ? 'text-red-500' : 'text-green-900'
        ]"
        class="flex items-center"
      >
        {{ user.username }}
        <span class="ml-auto">
          <i class="fas fa-paper-plane text-black"></i>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { createOnlineUsers } from '../modules/OnlineUsers.js'; // Adjust the path to the correct location of your file

// Define props and emits
const props = defineProps(['currentUser', 'currentChatUser']);
const emit = defineEmits(['selectUser', 'hasUnreadMessages', 'closeSidebar']);

// Use the createOnlineUsers function to get the required data and methods
const {
  filteredUsers,
  shouldHighlightUser,
  selectUser
} = createOnlineUsers(props, emit);
</script>
