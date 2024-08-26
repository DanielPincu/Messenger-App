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
const emit = defineEmits(['login']);  // Define an event emitter for login

// Handle the login process
const login = async () => {
  if (username.value.trim()) {
    const randomNum = Math.floor(Math.random() * 1000);  // Generate a random number between 0 and 999
    username.value = `${username.value}${randomNum.toString().padStart(3, '0')}`;  // Append the random number to the username

    const userRef = doc(db, 'users', username.value);  // Reference to the user document in Firestore
    await setDoc(userRef, {
      username: username.value,
      online: true,
      unreadFrom: '',  // Initialize the unreadFrom field
    });

    emit('login', username.value);  // Emit the login event with the username
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
