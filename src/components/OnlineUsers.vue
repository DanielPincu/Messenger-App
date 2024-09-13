<template>
  <div class="w-full p-5 bg-blue-200 rounded-xl">
    <h3 class="text-lg font-semibold text-green-700 text-center mb-4">Online Users</h3>
    <ul>
      <li
        v-for="user in filteredUsers"
        :key="user.username"
        @click="selectUser(user)"
        :class="[
          'p-2 bg-green-100 mb-2 font-bold hover:bg-green-400 duration-200 rounded-md cursor-pointer',
          shouldHighlightUser(user.username) ? 'text-red-500' : 'text-green-900'
        ]"
        class="flex items-center"
      >
        {{ user.username }}
        <span class="ml-auto">
          <i class="fas fa-paper-plane text-black"></i>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Define props for currentUser and currentChatUser
const props = defineProps(['currentUser', 'currentChatUser']);

const users = ref([]);
const unreadFrom = ref([]);
const emit = defineEmits(['selectUser', 'hasUnreadMessages', 'closeSidebar']);

// Fetch online users and monitor unread messages
onMounted(() => {
  console.log('Fetching online users...');

  const userQuery = query(collection(db, 'users'), where('online', '==', true));

  onSnapshot(userQuery, (snapshot) => {
    console.log('Snapshot received:', snapshot.docs.length, 'documents');

    users.value = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('User data:', data);

      if (data.username === props.currentUser) {
        unreadFrom.value = data.unreadFrom ? data.unreadFrom.split(',') : [];
        console.log('Unread messages from:', unreadFrom.value);
        emit('hasUnreadMessages', unreadFrom.value.length > 0);
      }

      return data;
    });

    console.log('Users list:', users.value);
  });
});

// Filter out the current user from the list of online users
const filteredUsers = computed(() => {
  const filtered = users.value.filter(user => user.username !== props.currentUser);
  console.log('Filtered Users:', filtered);
  return filtered;
});

// Determine if the user should be highlighted
const shouldHighlightUser = (username) => {
  return unreadFrom.value.includes(username) && props.currentChatUser !== username;
};

// Handle user selection and update unread messages
const selectUser = async (user) => {
  console.log('Selecting user:', user.username);

  if (unreadFrom.value.includes(user.username)) {
    unreadFrom.value = unreadFrom.value.filter(name => name !== user.username);

    // Update the unreadFrom field in Firestore for the current user
    const userDocRef = doc(db, 'users', props.currentUser);
    await updateDoc(userDocRef, {
      unreadFrom: unreadFrom.value.join(',')
    });
    console.log('Updated unreadFrom after selecting user:', unreadFrom.value);
  }

  emit('selectUser', user.username);

  // Close the sidebar only if the screen width is less than 768px
  if (window.innerWidth < 768) {
    emit('closeSidebar');
  }
};
</script>
