<template>
  <div class="login-container">
    <h1 class="pb-5 text-3xl">Login</h1>
    <input v-model="username" placeholder="Enter your username" />
    <button class="bg-blue-500" @click="loginWithUsername">Login with Username</button>
    <h2 class="pt-5">OR</h2>
    <button class="bg-blue-500" @click="loginWithGoogle">Login with Google</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { db } from '../firebase';

const username = ref('');
const emit = defineEmits(['login']);  // Define an event emitter for login

// Handle the username-based login process
const loginWithUsername = async () => {
  if (username.value.trim()) {
    try {
      // Sanitize username to remove spaces and ensure it's a valid Firestore ID
      const sanitizedUsername = username.value.replace(/\s+/g, '_');

      // Generate a random number to append to the username
      const randomNum = Math.floor(Math.random() * 1000);  // Generates a random number between 0 and 999
      const finalUsername = `${sanitizedUsername}${randomNum.toString().padStart(3, '0')}`;  // Appends the random number

      // Check if the username already exists
      const userDocRef = doc(db, 'users', finalUsername);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Store user data in Firestore with the final username as the document ID
        await setDoc(userDocRef, {
          username: finalUsername,
          online: true,
          unreadFrom: '',  // Initialize the unreadFrom field
        });

        console.log('User logged in with username:', finalUsername);

        // Emit the login event with the final username
        emit('login', { uid: finalUsername, displayName: finalUsername });
      } else {
        console.error('Username already exists. Please choose another one.');
      }
    } catch (error) {
      console.error('Error during username login:', error.message);
    }
  } else {
    console.warn('Login failed: Username cannot be empty.');
  }
};

// Handle Google login process
const loginWithGoogle = async () => {
  try {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    // Open the Google sign-in popup
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    console.log('Google login successful:', user.uid);

    // Use the displayName as the document ID in Firestore
    const userDisplayName = user.displayName || `user_${user.uid}`;
    const sanitizedDisplayName = userDisplayName.replace(/\s+/g, '_');

    // Store user data in Firestore using displayName as the document ID
    const userRef = doc(db, 'users', sanitizedDisplayName);
    await setDoc(userRef, {
      username: sanitizedDisplayName,
      email: user.email,
      online: true,
      unreadFrom: '',  // Initialize the unreadFrom field
    });

    console.log('User data saved to Firestore with displayName as ID:', sanitizedDisplayName);

    // Emit the login event with the sanitized displayName
    emit('login', { uid: sanitizedDisplayName, displayName: sanitizedDisplayName });
  } catch (error) {
    console.error('Error during Google login:', error.message);
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
  color: white;
  border: none;
  cursor: pointer;
  margin-top: 10px;
}


</style>
