<template>
  <div class="bg flex flex-col w-full items-center justify-center min-h-screen bg-gray-100">
    <div class="w-full flex flex-col items-center justify-center bg-cyan-200 bg-opacity-60 my-10">
      <img class="w-1/2 mb-10" src="/logo.png" alt="">
    </div>
    <div class="bg-cyan-300 bg-opacity-90 p-8 rounded-lg shadow-md">
      <h2 class="pb-5 text-3xl text-center text-blue-600 font-bold">Log in and have fun!</h2>
      <input
        v-model="username"
        placeholder="Enter a nickname and join Chatognito"
        class="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        class="w-full bg-cyan-600 text-white py-2 rounded-md font-semibold hover:bg-cyan-700"
        @click="loginWithUsername(emit)"
      >
        Log In with Nickname
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
        class="w-full bg-blue-500 text-white py-2 rounded-md font-semibold hover:bg-blue-600"
        @click="loginWithGoogle(emit)"
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
          <span class="text-blue-600 hover:underline cursor-pointer" @click="showTerms = true"> Terms and Conditions </span>

        </label>
      </div>
    </div>

    <!-- Terms and Conditions Modal -->
    <div v-if="showTerms" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white p-8 rounded-lg shadow-lg w-11/12 max-w-3xl max-h-full overflow-y-auto">
        <h3 class="text-2xl font-bold mb-4">{{ terms.title }}</h3>
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
import { loginWithUsername, loginWithGoogle, acceptTermsAndClose, disagreeWithTerms, username, acceptedTerms, showTerms, errorMessage, terms } from '../modules/LoginSystem.js';

const emit = defineEmits(['login']);
</script>
