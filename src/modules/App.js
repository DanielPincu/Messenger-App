import { ref, onMounted } from 'vue';
import { doc, updateDoc } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { db } from '../modules/Firebase.js';

// Initialize reactive variables
export function App() {
  const username = ref('');
  const displayName = ref('');
  const chatWith = ref(null);

  // Handle the login process
  const handleLogin = ({ uid, displayName: name }) => {
    username.value = uid;
    displayName.value = name;
    localStorage.setItem('username', uid);
    localStorage.setItem('displayName', name);
  };

  // Select a user to chat with
  const selectUser = (user) => {
    chatWith.value = user;
  };

  // Switch back to the public chat
  const switchToPublic = () => {
    chatWith.value = null;
  };

  // Update the user's online status to offline in Firestore
  const updateUserStatus = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { online: false });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  // Log the user out
  const logout = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      try {
        await updateUserStatus(username.value);
        await signOut(auth);
        console.log('Firebase user logged out successfully');
      } catch (error) {
        console.error('Error during Firebase logout:', error.message);
      }
    } else if (username.value) {
      try {
        await updateUserStatus(username.value);
        console.log('Custom user logged out successfully');
      } catch (error) {
        console.error('Error during custom logout:', error.message);
      }
    } else {
      console.warn('No user is currently logged in.');
    }

    username.value = '';
    displayName.value = '';
    chatWith.value = null;

    localStorage.removeItem('username');
    localStorage.removeItem('displayName');
  };

  // Check if the user is already logged in when the component mounts
  onMounted(() => {
    const storedUsername = localStorage.getItem('username');
    const storedDisplayName = localStorage.getItem('displayName');
    if (storedUsername) {
      username.value = storedUsername;
      displayName.value = storedDisplayName;
    }
  });

  return {
    username,
    displayName,
    chatWith,
    handleLogin,
    selectUser,
    switchToPublic,
    logout,
  };
}
