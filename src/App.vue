<template>
  <div id="app">
    <Login v-if="!username" @login="handleLogin" />
    <div v-else>
      <div class="header">
        <h2>Welcome, {{ username }}</h2>
        <button @click="logout">Logout</button>
      </div>
      <UserList :currentUser="username" @selectUser="selectUser" />
      <Chat :username="username" :chatWith="chatWith" @switchToPublic="switchToPublic" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Login from './components/Login.vue';
import Chat from './components/Chat.vue';
import UserList from './components/UserList.vue';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const username = ref('');
const chatWith = ref(null);

onMounted(() => {
  const storedUsername = localStorage.getItem('username');
  if (storedUsername) {
    username.value = storedUsername;
  }
});

const handleLogin = (user) => {
  username.value = user;
  localStorage.setItem('username', user);
};

const selectUser = (user) => {
  chatWith.value = user;
};

const switchToPublic = () => {
  chatWith.value = null;  // Switch back to public chat
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

    console.log('Logout successful');
  }
};
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
</style>
