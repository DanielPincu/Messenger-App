<template>
  <div class="flex flex-col w-full items-center justify-center min-h-screen bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-md w-96">
      <h1 class="pb-5 text-3xl text-center text-blue-600 font-bold">Log in to Chatognito</h1>
      <input
        v-model="username"
        placeholder="Email or Phone Number"
        class="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        class="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700"
        @click="loginWithUsername"
      >
        Log In
      </button>
      <div v-if="errorMessage" class="mt-4 text-red-600 text-sm">
        {{ errorMessage }}
      </div>
      <div class="flex items-center justify-between my-4">
        <hr class="w-full border-gray-300" />
        <span class="px-2 text-gray-500">OR</span>
        <hr class="w-full border-gray-300" />
      </div>
      <button
        class="w-full bg-red-600 text-white py-2 rounded-md font-semibold hover:bg-red-700"
        @click="loginWithGoogle"
      >
        Log In with Google
      </button>
      <div class="text-center mt-5">
        <p class="text-red-600">By logging in you declare you are over 18 years old and you agree with the Terms and Conditions stated below</p>
      </div>
      <div class="flex items-center my-4">
        <input
          type="checkbox"
          id="terms"
          v-model="acceptedTerms"
          class="mr-2"
        />
        <label for="terms" class="text-sm text-gray-700">
          I read, and I consent to 
          <a href="#" class="text-blue-600 hover:underline" @click.prevent="showTerms = true">Terms and Conditions</a>
        </label>
      </div>
    </div>

    <!-- Terms and Conditions Modal -->
    <div v-if="showTerms" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white p-8 rounded-lg shadow-lg w-11/12 max-w-3xl max-h-full overflow-y-auto">
        <h1 class="text-2xl font-bold mb-4">{{ terms.title }}</h1>
        <div v-for="(section, index) in terms.sections" :key="index">
          <h2 class="text-xl font-semibold mt-4">{{ section.heading }}</h2>
          <p>{{ section.content }}</p>
        </div>
        <div class="flex text-center justify-center mt-6">
          <button @click="acceptTermsAndClose" class="bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700">I read, and I consent</button>
          <button @click="disagreeWithTerms" class="bg-red-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-red-700 ml-4">I do not agree</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { db } from '../firebase';
import termsData from '../assets/terms.json';

const username = ref('');
const acceptedTerms = ref(false);
const showTerms = ref(false);
const errorMessage = ref('');
const terms = ref(termsData); // Use imported terms data

const emit = defineEmits(['login']);

// Handle the username-based login process
const loginWithUsername = async () => {
  errorMessage.value = '';

  if (!username.value.trim()) {
    errorMessage.value = 'Username cannot be empty.';
    return;
  }

  if (!acceptedTerms.value) {
    errorMessage.value = 'You must accept the Terms and Conditions to log in.';
    return;
  }

  try {
    const sanitizedUsername = username.value.replace(/\s+/g, '_');
    const randomNum = Math.floor(Math.random() * 1000);
    const finalUsername = `${sanitizedUsername}${randomNum.toString().padStart(3, '0')}`;

    const userDocRef = doc(db, 'users', finalUsername);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        username: finalUsername,
        online: true,
        unreadFrom: '',
      });

      console.log('User logged in with username:', finalUsername);
      emit('login', { uid: finalUsername, displayName: finalUsername });
    } else {
      errorMessage.value = 'Username already exists. Please choose another one.';
    }
  } catch (error) {
    errorMessage.value = 'Error during login: ' + error.message;
  }
};

// Handle Google login process
const loginWithGoogle = async () => {
  if (!acceptedTerms.value) {
    errorMessage.value = 'You must accept the Terms and Conditions to log in.';
    return;
  }

  try {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    console.log('Google login successful:', user.uid);

    const userDisplayName = user.displayName || `user_${user.uid}`;
    const sanitizedDisplayName = userDisplayName.replace(/\s+/g, '_');

    const userRef = doc(db, 'users', sanitizedDisplayName);
    await setDoc(userRef, {
      username: sanitizedDisplayName,
      email: user.email,
      online: true,
      unreadFrom: '',
    });

    console.log('User data saved to Firestore with displayName as ID:', sanitizedDisplayName);
    emit('login', { uid: sanitizedDisplayName, displayName: sanitizedDisplayName });
  } catch (error) {
    errorMessage.value = 'Error during Google login: ' + error.message;
  }
};

// Handle acceptance of terms and conditions
const acceptTermsAndClose = () => {
  acceptedTerms.value = true;
  showTerms.value = false;
};

// Handle disagreement with terms and conditions
const disagreeWithTerms = () => {
  acceptedTerms.value = false;
  showTerms.value = false;
};
</script>
