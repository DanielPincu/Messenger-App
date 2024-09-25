<template>
  <div id="app" class="w-full md:h-screen bg-gray-300">
    <div v-if="!username" class="flex items-center justify-center h-full">
      <Login @login="handleLogin" />
    </div>
    <div v-else>
      <div class="header bg-white shadow-md p-4 flex justify-between items-center">
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
        <Chat 
          :username="displayName" 
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
import { getAuth, signOut } from 'firebase/auth';
import { db } from './firebase';

const username = ref('');  // Store the logged-in user's UID or custom username
const displayName = ref('');  // Store the logged-in user's display name (username or Google name)
const chatWith = ref(null);  // Track the current user being chatted with

// Handle the login process
const handleLogin = ({ uid, displayName: name }) => {
  username.value = uid;  // Set the logged-in user's UID or custom username
  displayName.value = name;  // Set the display name
  localStorage.setItem('username', uid);  // Save the UID or custom username in localStorage
  localStorage.setItem('displayName', name);  // Save the display name in localStorage
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
const updateUserStatus = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { online: false });  // Set the user's status to offline
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

// Log the user out
const logout = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    try {
      // Update the user's status to offline using UID
      await updateUserStatus(username.value);

      // Sign out the user from Firebase Authentication
      await signOut(auth);

      console.log('Firebase user logged out successfully');
    } catch (error) {
      console.error('Error during Firebase logout:', error.message);
    }
  } else if (username.value) {
    // Handle custom username-based logout
    try {
      // Update the user's status to offline in Firestore
      await updateUserStatus(username.value);

      console.log('Custom user logged out successfully');
    } catch (error) {
      console.error('Error during custom logout:', error.message);
    }
  } else {
    console.warn('No user is currently logged in.');
  }

  // Clear user information
  username.value = '';
  displayName.value = '';
  chatWith.value = null;

  // Remove from localStorage
  localStorage.removeItem('username');
  localStorage.removeItem('displayName');
};

// Check if the user is already logged in when the component mounts
onMounted(() => {
  const storedUsername = localStorage.getItem('username');
  const storedDisplayName = localStorage.getItem('displayName');
  if (storedUsername) {
    username.value = storedUsername;  // Set the stored UID or custom username
    displayName.value = storedDisplayName || 'Anonymous';  // Set the stored display name
  }
});
</script>

