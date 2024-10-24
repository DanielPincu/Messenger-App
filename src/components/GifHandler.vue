<template>
  <div class="w-1/4 mr-[2px] container mx-auto">
    <!-- Search Input -->
    <div class="flex items-center">
      <input
        v-model="searchQuery"
        placeholder="Search for GIFs..."
        class="flex-1 px-4 py-2 w-1/2 rounded-l-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-600 transition ease-in-out duration-200"
        @input="resetGifs"
      />
    </div>

    <!-- GIF Results (Only show if there is text in the search box) -->
    <div
      v-if="searchQuery.trim() !== ''"
      class="gif-grid grid grid-cols-3 gap-3 max-h-[250px] overflow-y-auto border border-gray-200 rounded-lg p-2"
      @scroll="handleScroll"
      ref="gifGrid"
    >
      <div
        v-for="gif in gifs"
        :key="gif.id"
        class="gif-item cursor-pointer relative group"
        @click="selectGif(gif.media_formats.gif.url)"
      >
        <img
          :src="gif.media_formats.tinygif.url"
          class="rounded-md shadow-md w-full h-full object-cover transition-transform transform group-hover:scale-105"
          alt="GIF"
        />
        <!-- Overlay on hover for selection feedback -->
        <div class="absolute inset-0 bg-black bg-opacity-25 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const apiKey = 'AIzaSyD6-w8a7rFM2QRG2wGzesuesRkp6CsNKpg';
const emit = defineEmits(['gifSelected']);
const searchQuery = ref('');
const gifs = ref([]);
const limit = 50; // Number of GIFs to fetch in each request
const hasMoreGifs = ref(true); // Flag to indicate if there are more GIFs to load

const gifGrid = ref(null); // Reference to the GIF grid element



// Fetch GIFs from Tenor API
const fetchGifs = async (newOffset = 0) => {
  if (searchQuery.value.trim() === '') {
    gifs.value = [];
    hasMoreGifs.value = false; // No more GIFs to load if search is empty
    return;
  }

  try {
    const response = await fetch(`https://tenor.googleapis.com/v2/search?q=${searchQuery.value}&key=${apiKey}`);
    const data = await response.json();
    
    // If new GIFs are fetched, append them to the existing array
    if (data.results.length > 0) {
      gifs.value.push(...data.results);
      offset.value = newOffset + limit; // Update the offset for the next load
      hasMoreGifs.value = data.results.length === limit; // Check if more GIFs are available
    } else {
      hasMoreGifs.value = false; // No more GIFs available
    }
  } catch (error) {
    console.error('Error fetching GIFs:', error);
  }
};



// Select GIF for sending
const selectGif = (gifUrl) => {
  emit('gifSelected', gifUrl); // Emit the selected GIF URL to the parent component
  clearGifSearch(); // Clear search immediately after selection
};

// Reset GIFs when search input is cleared
const resetGifs = () => {
  gifs.value = [];
  fetchGifs(); // Fetch GIFs based on new input
};


const clearGifSearch = () => {
  searchQuery.value = ''; // Clear search input
  gifs.value = []; // Clear the GIF results
};


const handleScroll = () => {
  const { scrollTop, scrollHeight, clientHeight } = gifGrid.value;
  if (scrollTop + clientHeight >= scrollHeight - 50) { // Trigger when close to bottom
    fetchGifs();
  }
};

</script>

