<template>
  <v-container fluid fill-height class="d-flex align-center justify-center">
    <v-card class="pa-8" width="100%" max-width="500">
      <v-card-title class="justify-center">
        <h2>Login</h2>
      </v-card-title>

      <v-card-text>
        <v-text-field
          v-model="username"
          label="Enter your username"
          outlined
          prepend-inner-icon="mdi-account"
        ></v-text-field>
      </v-card-text>

      <v-card-actions class="justify-center">
        <v-btn color="primary" @click="login" block>Login</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const username = ref('');
const emit = defineEmits(['login']);

const login = async () => {
  if (username.value.trim()) {
    const randomNum = Math.floor(Math.random() * 1000); // Generates a random number between 0 and 999
    username.value = `${username.value}${randomNum.toString().padStart(3, '0')}`; // Modifies username to include the random number

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
