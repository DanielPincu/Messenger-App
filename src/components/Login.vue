<template>
  <div class="login-container">
    <h2>Login</h2>
    <input v-model="username" placeholder="Enter your username" />
    <button @click="login">Login</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const username = ref('');
const emit = defineEmits(['login']);

const login = async () => {
  if (username.value.trim()) {
    const userRef = doc(db, 'users', username.value);
    await setDoc(userRef, {
      username: username.value,
      online: true,
      unreadFrom: '', // Initialize with no unread messages
    });

    emit('login', username.value);
  }
};
</script>

<style scoped>
.login-container {
  max-width: 300px;
  margin: 50px auto;
  text-align: center;
}

input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
}

button {
  padding: 10px 20px;
  background-color: #42b983;
  color: white;
  border: none;
  cursor: pointer;
}
</style>
