<template>
  <div id="app" class="w-full md:h-screen bg-gray-300">
    <div v-if="!username" class="flex items-center justify-center h-full">
      <Login @login="handleLogin" />
    </div>
    <div v-else>
      <div class="header bg-white shadow-md p-4 flex justify-between items-center">
        <h2 class="text-xl font-bold text-gray-800">Welcome, {{ username }}</h2>
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
        <!-- <UserList 
          :currentUser="username" 
          @selectUser="selectUser" 
          class="bg-white p-4 border-r border-gray-300"
        /> -->
        <Chat 
          :username="username" 
          :chatWith="chatWith" 
          @switchToPublic="switchToPublic" 
          class="w-3/4 p-0 md:p-4"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Login from './components/Login.vue';
import Chat from './components/Chat.vue';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const username = ref('');  // Store the logged-in username
const chatWith = ref(null);  // Track the current user being chatted with

// Handle the login process
const handleLogin = (user) => {
  username.value = user;  // Set the logged-in username
  localStorage.setItem('username', user);  // Save the username in localStorage
};

// Select a user to chat with
const selectUser = (user) => {
  chatWith.value = user;  // Set the user being chatted with
};

// Switch back to the public chat
const switchToPublic = () => {
  chatWith.value = null;  // Set chatWith to null for public chat
};

// Update the user's online status to offline in Firestore
const updateUserStatus = async (user) => {
  try {
    const userRef = doc(db, 'users', user);
    await updateDoc(userRef, { online: false });  // Set the user's status to offline
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

// Log the user out
const logout = async () => {
  if (username.value) {
    await updateUserStatus(username.value);  // Update the user's status to offline
    localStorage.removeItem('username');  // Remove the username from localStorage
    username.value = '';  // Clear the username
    chatWith.value = null;  // Clear the chatWith value
  }
};

// Check if the user is already logged in when the component mounts
onMounted(() => {
  const storedUsername = localStorage.getItem('username');
  if (storedUsername) {
    username.value = storedUsername;  // Set the stored username
  }
});
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

button:hover {
  background-color: #ff6b6b;
}
</style>
