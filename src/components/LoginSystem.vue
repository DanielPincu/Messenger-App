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
        <h1 class="text-2xl font-bold mb-4">Anonymous Chat Platform Terms and Conditions</h1>
        <h2 class="text-xl font-semibold mt-4">1. Acceptance of Terms</h2>
        <p>By participating in this anonymous user chat platform, you agree to abide by and accept these terms and conditions.</p>

        <h2 class="text-xl font-semibold mt-4">2. User Eligibility</h2>
        <p>Users must be at least 18 years old. If you are not 18 years old, you must obtain legal consent from a parent or guardian to use this platform. The website is not able to verify any information provided by the user.</p>

        <h2 class="text-xl font-semibold mt-4">3. Anonymous Nature</h2>
        <p>Users acknowledge and understand that the chat is entirely anonymous. Any information shared is done voluntarily, and users are solely responsible for the content they disclose.</p>

        <h2 class="text-xl font-semibold mt-4">4. Prohibited Content</h2>
        <p>Users agree not to share unlawful, harmful, threatening, abusive, defamatory, obscene, or objectionable content. The platform does not engage in moderation, and users are responsible for their interactions.</p>

        <h2 class="text-xl font-semibold mt-4">5. Privacy and Data Handling</h2>
        <p>The platform does not collect any information from users. Users can chat without concerns about their data being stored or used. There is no way of retrieving the content of any given conversation or any other information whatsoever. The information is not stored in the website's server and the conversations are end-to-end encrypted.</p>

        <h2 class="text-xl font-semibold mt-4">6. No Moderation</h2>
        <p>There is no content moderation on this platform. Users should exercise caution, and if they feel unsafe, they are encouraged to disconnect immediately, as the platform does not intervene in user interactions.</p>

        <h2 class="text-xl font-semibold mt-4">7. Security</h2>
        <p>Users are responsible for their own privacy and security during chats. As there is no login information, sharing personal or sensitive information is at the user's own risk.</p>

        <h2 class="text-xl font-semibold mt-4">8. No Warranty</h2>
        <p>The platform provides the service "as is" without any warranty. Users utilize the platform at their own risk, and the platform is not liable for any interruptions or errors.</p>

        <h2 class="text-xl font-semibold mt-4">9. Termination of Connection</h2>
        <p>While the platform does not possess the capability to terminate connections or suspend participation in the chat, users are encouraged to be aware that such actions, if necessary, cannot be initiated by the platform itself.</p>

        <h2 class="text-xl font-semibold mt-4">10. Updates to Terms</h2>
        <p>The platform may update these terms periodically. Users will be informed of significant changes, and continued participation constitutes acceptance of the updated terms.</p>

        <div class="text-center mt-6">
          <button @click="acceptTermsAndClose" class="bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700">I read, and I consent</button>
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

const username = ref('');
const acceptedTerms = ref(false);
const showTerms = ref(false);
const errorMessage = ref('');
const emit = defineEmits(['login']);  // Define an event emitter for login

// Handle the username-based login process
const loginWithUsername = async () => {
  errorMessage.value = ''; // Reset error message

  if (!username.value.trim()) {
    errorMessage.value = 'Username cannot be empty.';
    return;
  }

  if (!acceptedTerms.value) {
    errorMessage.value = 'You must accept the Terms and Conditions to log in.';
    return;
  }

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
    errorMessage.value = 'Error during Google login: ' + error.message;
  }
};

// Handle acceptance of terms and conditions
const acceptTermsAndClose = () => {
  acceptedTerms.value = true;  // Check the checkbox
  showTerms.value = false;  // Close the modal
};
</script>
