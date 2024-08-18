<template>
  <div id="app">
    <Login v-if="!username" @login="handleLogin" />
    <div v-else>
      <div class="header">
        <h2>Welcome, {{ username }}</h2>
        <div class="logout-section">
          <button @click="logout">Logout <span v-if="countdown > 0" class="countdown">{{ countdown }}</span></button>
          
        </div>
      </div>
      <UserList :currentUser="username" @selectUser="selectUser" />
      <Chat :username="username" :chatWith="chatWith" @switchToPublic="switchToPublic" />
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
  }, 9000);  // Wait for 10 seconds before starting the countdown
};

const startCountdown = () => {
  countdown.value = 9;  // Set countdown to 10 seconds
  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1;
    } else {
      clearInterval(countdownTimer);
      logout();  // Logout when countdown reaches 0
    }
  }, 900);  // Decrease countdown every second
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
  chatWith.value = null;  // Switch back to public chat
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

    // Update user status to offline
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
  padding: 10px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.logout-section {
  display: flex;
  align-items: center;
}

button {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
}

button:hover {
  background-color: #358a68;
}

.countdown {
  margin-left: 10px;
  font-weight: bold;
  color: rgb(243, 233, 233);
}
</style>
