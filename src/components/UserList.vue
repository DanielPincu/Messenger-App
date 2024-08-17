<template>
  <div class="user-list">
    <h3>Online Users</h3>
    <ul>
      <li
        v-for="user in filteredUsers"
        :key="user.username"
        @click="selectUser(user)"
        :class="{ 'has-unread-message': unreadFrom.includes(user.username) }"
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

<style scoped>
.user-list {
  max-width: 200px;
  margin: 20px;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  padding: 8px;
  margin: 4px 0;
  cursor: pointer;
  background-color: #f0f0f0;
  border-radius: 4px;
}

li:hover {
  background-color: #e0e0e0;
}

.has-unread-message {
  color: red;
  font-weight: bold;
}
</style>
