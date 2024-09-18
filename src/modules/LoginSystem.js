import { ref } from 'vue';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { db } from '../firebase';
import termsData from '../assets/terms.json';

export const username = ref(''); // Unified username ref
export const acceptedTerms = ref(false);
export const showTerms = ref(false);
export const errorMessage = ref('');
export const terms = ref(termsData); // Use imported terms data

// Handle the username-based login process
export const loginWithUsername = async (emit) => {
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
      // Save to Firestore with the unified username
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
export const loginWithGoogle = async (emit) => {
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

    // Use Google displayName or fallback to a generated name
    const userDisplayName = user.displayName || `user_${user.uid}`;
    const sanitizedDisplayName = userDisplayName.replace(/\s+/g, '_');

    // Save the display name in the unified username ref
    username.value = sanitizedDisplayName;

    const userRef = doc(db, 'users', username.value);
    await setDoc(userRef, {
      username: username.value,
      email: user.email,
      online: true,
      unreadFrom: '',
    });

    console.log('User data saved to Firestore with displayName as ID:', username.value);
    emit('login', { uid: username.value, displayName: username.value });
  } catch (error) {
    errorMessage.value = 'Error during Google login: ' + error.message;
  }
};

// Handle acceptance of terms and conditions
export const acceptTermsAndClose = () => {
  acceptedTerms.value = true;
  showTerms.value = false;
};

// Handle disagreement with terms and conditions
export const disagreeWithTerms = () => {
  acceptedTerms.value = false;
  showTerms.value = false;
};
