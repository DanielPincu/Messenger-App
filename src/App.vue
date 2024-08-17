<template>
  <div id="app">
    <Login v-if="!username" @login="handleLogin" />
    <div v-else>
      <div class="header">
        <h2>Welcome, {{ username }}</h2>
        <button @click="logout">Logout</button>
      </div>
      <UserList :currentUser="username" @selectUser="selectUser" />
      <Chat :username="username" :chatWith="chatWith" @switchToPublic="switchToPublic" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Login from './components/Login.vue';
import Chat from './components/Chat.vue';
import UserList from './components/UserList.vue';
import { doc, updateDoc, deleteDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const username = ref('');
const chatWith = ref(null);

onMounted(() => {
  const storedUsername = localStorage.getItem('username');
  if (storedUsername) {
    username.value = storedUsername;
  }
});

const handleLogin = (user) => {
  username.value = user;
  localStorage.setItem('username', user);
};

const selectUser = (user) => {
  chatWith.value = user;
};

const switchToPublic = () => {
  chatWith.value = null;  // Switch back to public chat
};

const updateUserStatus = async (user) => {
  try {
    const userRef = doc(db, 'users', user);
    await updateDoc(userRef, { online: false });
    console.log(`User ${user} status updated to offline.`);
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

const deleteSentMessages = async (username) => {
  try {
    // Fetch all private chat rooms involving the user
    const chatRoomsQuery = query(collection(db, 'private_chats'), where('participants', 'array-contains', username));
    const chatRoomsSnapshot = await getDocs(chatRoomsQuery);

    if (chatRoomsSnapshot.empty) {
      console.log('No private chat rooms found for user:', username);
      return;
    }

    for (const chatRoomDoc of chatRoomsSnapshot.docs) {
      const chatRoomId = chatRoomDoc.id;
      const messagesRef = collection(db, chatRoomId);

      // Fetch all messages in the chat room
      const messagesSnapshot = await getDocs(messagesRef);
      if (messagesSnapshot.empty) {
        console.log(`No messages found in chat room ${chatRoomId}.`);
        continue;
      }

      for (const messageDoc of messagesSnapshot.docs) {
        const messageData = messageDoc.data();

        // Delete messages sent by the user
        if (messageData.sender === username) {
          await deleteDoc(messageDoc.ref);
          console.log(`Deleted message with ID: ${messageDoc.id}`);
        }
      }
    }
  } catch (error) {
    console.error('Error deleting sent messages:', error);
  }
};

const cleanupChatRooms = async (username) => {
  try {
    // Fetch all private chat rooms involving the user
    const chatRoomsQuery = query(collection(db, 'private_chats'), where('participants', 'array-contains', username));
    const chatRoomsSnapshot = await getDocs(chatRoomsQuery);

    if (chatRoomsSnapshot.empty) {
      console.log('No private chat rooms found for user:', username);
      return;
    }

    for (const chatRoomDoc of chatRoomsSnapshot.docs) {
      const chatRoomId = chatRoomDoc.id;
      const messagesRef = collection(db, chatRoomId);

      // Check if there are any messages left in the chat room
      const messagesSnapshot = await getDocs(messagesRef);
      if (messagesSnapshot.empty) {
        await deleteDoc(doc(db, 'private_chats', chatRoomId));
        console.log(`Deleted empty chat room with ID: ${chatRoomId}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up chat rooms:', error);
  }
};

const logout = async () => {
  if (username.value) {
    try {
      console.log('Logging out user:', username.value);

      // Update user status to offline
      await updateUserStatus(username.value);

      // Delete all messages sent by the user
      await deleteSentMessages(username.value);

      // Optionally, delete the user's chat rooms if needed
      await cleanupChatRooms(username.value);

      localStorage.removeItem('username');
      username.value = '';
      chatWith.value = null;

      console.log('Logout successful');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
};
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

button {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
}

button:hover {
  background-color: #358a68;
}
</style>
