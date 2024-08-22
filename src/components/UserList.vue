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

const props = defineProps(['currentUser']);
const users = ref([]);
const unreadFrom = ref([]); 
const emit = defineEmits(['selectUser']);

onMounted(() => {
  const q = query(collection(db, 'users'), where('online', '==', true));
  onSnapshot(q, (snapshot) => {
    users.value = snapshot.docs.map(doc => {
      const data = doc.data();
      if (data.username === props.currentUser) {
        unreadFrom.value = data.unreadFrom ? data.unreadFrom.split(',') : [];
      }
      return data;
    });
  });
});

const filteredUsers = computed(() => {
  return users.value.filter(user => user.username !== props.currentUser);
});

const selectUser = async (user) => {
  // Clear the unread messages for this user when they open the chat
  if (unreadFrom.value.includes(user.username)) {
    const index = unreadFrom.value.indexOf(user.username);
    if (index > -1) {
      unreadFrom.value.splice(index, 1);
    }

    // Update the user's unreadFrom field in Firebase
    const userDocRef = doc(db, 'users', props.currentUser);
    await updateDoc(userDocRef, {
      unreadFrom: unreadFrom.value.join(',')
    });
  }

  emit('selectUser', user.username);
};
</script>

<style scoped>
/* Add any necessary styles here */
</style>
