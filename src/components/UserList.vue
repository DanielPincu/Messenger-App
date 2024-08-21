<template>
  <div class="w-3/4 md:w-72 p-5 mt-10 mx-auto bg-blue-500 rounded-xl">
    <h3 class="text-lg font-semibold mb-4">Online Users</h3>
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
import { collection, query, where, onSnapshot, doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';

const props = defineProps(['currentUser']);
const users = ref([]);
const unreadFrom = ref([]); // Track users who have sent unread messages
const emit = defineEmits(['selectUser']);

onMounted(() => {
  const currentUserRef = doc(db, 'users', props.currentUser);
  onSnapshot(currentUserRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      unreadFrom.value = docSnapshot.data().unreadFrom || [];
    }
  });

  const q = query(collection(db, 'users'), where('online', '==', true));
  onSnapshot(q, (snapshot) => {
    users.value = snapshot.docs.map(doc => doc.data());
  });
});

const filteredUsers = computed(() => {
  return users.value.filter(user => user.username !== props.currentUser);
});

const selectUser = async (user) => {
  emit('selectUser', user.username);

  if (unreadFrom.value.includes(user.username)) {
    const currentUserRef = doc(db, 'users', props.currentUser);
    await updateDoc(currentUserRef, {
      unreadFrom: arrayRemove(user.username),
    });
    unreadFrom.value = unreadFrom.value.filter(u => u !== user.username);
  }
};
</script>


