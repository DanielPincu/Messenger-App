<template>
  <div class="w-full md:w-72 p-5 bg-blue-500 rounded-xl">
    <h3 class="text-lg font-semibold mb-4 text-white">Online Users</h3>
    <ul>
      <li
        v-for="user in filteredUsers"
        :key="user.username"
        @click="selectUser(user)"
        :class="[ 'p-2 bg-slate-300 mb-2 hover:bg-gray-400 duration-200 rounded-md cursor-pointer',
          unreadFrom.includes(user.username) ? 'text-red-500 font-bold' : 'text-gray-800'
        ]"
      >
        {{ user.username }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const props = defineProps(['currentUser']);  // Receive the current user's username as a prop
const users = ref([]);  // Reactive variable to store online users
const unreadFrom = ref([]);  // Track which users have sent unread messages
const emit = defineEmits(['selectUser', 'hasUnreadMessages']);  // Define event emitters

// Fetch online users and monitor unread messages
onMounted(() => {
  const q = query(collection(db, 'users'), where('online', '==', true));
  onSnapshot(q, (snapshot) => {
    users.value = snapshot.docs.map(doc => {
      const data = doc.data();
      if (data.username === props.currentUser) {
        unreadFrom.value = data.unreadFrom ? data.unreadFrom.split(',') : [];  // Update unread messages list
        emit('hasUnreadMessages', unreadFrom.value.length > 0);  // Emit an event if there are unread messages
      }
      return data;
    });
  });
});

// Filter out the current user from the list of online users
const filteredUsers = computed(() => {
  return users.value.filter(user => user.username !== props.currentUser);
});

// Handle user selection and update unread messages
const selectUser = async (user) => {
  // If the selected user has unread messages, clear them
  if (unreadFrom.value.includes(user.username)) {
    const index = unreadFrom.value.indexOf(user.username);
    if (index > -1) {
      unreadFrom.value.splice(index, 1);  // Remove the user from the unread messages list
    }

    // Update the unreadFrom field in Firestore for the current user
    const userDocRef = doc(db, 'users', props.currentUser);
    await updateDoc(userDocRef, {
      unreadFrom: unreadFrom.value.join(',')
    });
  }

  emit('selectUser', user.username);  // Emit the selectUser event with the selected username
};
</script>

