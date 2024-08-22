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
            Logout <span v-if="countdown > 0" class="countdown text-sm font-semibold ml-2">{{ countdown }}</span>
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
import { ref, onMounted, onUnmounted } from 'vue';
import Login from './components/Login.vue';
import Chat from './components/Chat.vue';
import UserList from './components/UserList.vue';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const username = ref('');
const chatWith = ref(null);
let inactivityTimer = null;
let countdownTimer = null;
const countdown = ref(0);

const startInactivityTimer = () => {
  clearInactivityTimer();
  inactivityTimer = setTimeout(() => {
    startCountdown();
  }, 900000);
};

const startCountdown = () => {
  countdown.value = 9;
  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1;
    } else {
      clearInterval(countdownTimer);
      logout();
    }
  }, 90000);
};

const resetInactivityTimer = () => {
  clearInactivityTimer();
  countdown.value = 0;
  startInactivityTimer();
};

const clearInactivityTimer = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
};

const handleLogin = (user) => {
  username.value = user;
  localStorage.setItem('username', user);
  startInactivityTimer();
  addInactivityListeners();
};

const selectUser = (user) => {
  chatWith.value = user;
  resetInactivityTimer();
};

const switchToPublic = () => {
  chatWith.value = null;
  resetInactivityTimer();
};

const updateUserStatus = async (user) => {
  try {
    const userRef = doc(db, 'users', user);
    await updateDoc(userRef, { online: false });
    console.log(`User ${user} status updated to offline.`);
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

const logout = async () => {
  if (username.value) {
    console.log('Logging out user:', username.value);

    await updateUserStatus(username.value);

    localStorage.removeItem('username');
    username.value = '';
    chatWith.value = null;

    clearInactivityTimer();
    removeInactivityListeners();

    console.log('Logout successful');
  }
};

const handleUserActivity = () => {
  resetInactivityTimer();
};

const addInactivityListeners = () => {
  window.addEventListener('mousemove', handleUserActivity);
  window.addEventListener('keydown', handleUserActivity);
  window.addEventListener('click', handleUserActivity);
  window.addEventListener('scroll', handleUserActivity);
};

const removeInactivityListeners = () => {
  window.removeEventListener('mousemove', handleUserActivity);
  window.removeEventListener('keydown', handleUserActivity);
  window.removeEventListener('click', handleUserActivity);
  window.removeEventListener('scroll', handleUserActivity);
};

onMounted(() => {
  const storedUsername = localStorage.getItem('username');
  if (storedUsername) {
    username.value = storedUsername;
    startInactivityTimer();
    addInactivityListeners();
  }
});

onUnmounted(() => {
  clearInactivityTimer();
  removeInactivityListeners();
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

.countdown {
  margin-left: 10px;
  font-weight: bold;
  color: rgb(243, 233, 233);
}
</style>
