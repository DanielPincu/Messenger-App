<template>
  <div class="w-full p-5 border-l-[1px] border-cyan-600 bg-cyan-200 rounded-xl mt-1">
    <h3 class="text-lg font-semibold text-cyan-800 text-center mb-4">Online Users</h3>
    <ul>
      <li
        v-for="user in filteredUsers"
        :key="user.username"
        @click="selectUser(user)"
        :class="[
          'p-2 bg-cyan-400 mb-2 font-bold hover:scale-[102%] duration-200 rounded-md cursor-pointer',
          shouldHighlightUser(user.username) ? 'bg-orange-400' : 'text-slate-900'
        ]"
        class="flex items-center"
      >
        {{ user.username }}
        <span class="ml-auto">
          <i class="fas fa-paper-plane text-gray-900"></i>
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
