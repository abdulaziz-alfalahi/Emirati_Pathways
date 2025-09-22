
// Camp image mapping based on category and subcategories
export const campImages = {
  'Technology': {
    default: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=60', // Laptop
    'Coding': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=60', // Code on screen
    'Robotics': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=60', // Robot
    'Game Development': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=60' // Gaming setup
  },
  'Science': {
    default: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=60', // Science lab
    'Chemistry': 'https://images.unsplash.com/photo-1617791160536-598cf32026fb?auto=format&fit=crop&w=800&q=60', // Chemistry lab
    'Biology': 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=60', // Biology specimens
    'Physics': 'https://images.unsplash.com/photo-1636466497217-06a74db567f7?auto=format&fit=crop&w=800&q=60' // Physics equipment
  },
  'Arts': {
    default: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?auto=format&fit=crop&w=800&q=60', // Yellow lights, artistic
    'Visual Arts': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=60', // Art supplies
    'Performing Arts': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=60', // Theater stage
    'Music': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=60' // Music instruments
  },
  'Leadership': {
    default: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=60', // Mountain landscape
    'Public Speaking': 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=60', // Speaking podium
    'Entrepreneurship': 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=60', // Business meeting
    'Team Building': 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=60' // Team activity
  },
  'Sports': {
    default: 'https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?auto=format&fit=crop&w=800&q=60', // Mountain with grass
    'Soccer': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=60', // Soccer field
    'Swimming': 'https://images.unsplash.com/photo-1576013551627-0ae7d1d192c7?auto=format&fit=crop&w=800&q=60', // Swimming pool
    'Basketball': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=60' // Basketball court
  },
  'default': 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=60' // Bird's eye view of green mountains
};

// Helper function to get the best image for a camp based on category and content
export const getCampImage = (camp: {
  category?: string;
  title: string;
  description: string;
  image_url?: string;
}): string => {
  // Use image_url if provided and it's a valid URL
  if (camp.image_url && isValidImageUrl(camp.image_url)) {
    return appendImageParameters(camp.image_url);
  }
  
  // First check if the category exists
  if (!camp.category || !campImages[camp.category as keyof typeof campImages]) {
    return appendImageParameters(campImages.default);
  }
  
  const categoryImages = campImages[camp.category as keyof typeof campImages];
  
  // If the category exists but is just a string (not an object with subcategories)
  if (typeof categoryImages === 'string') {
    return appendImageParameters(categoryImages);
  }
  
  // Look for keywords in the title and description to determine the best subcategory image
  const content = (camp.title + ' ' + camp.description).toLowerCase();
  
  // Check for specific subcategory keywords
  for (const [subCategory, imageUrl] of Object.entries(categoryImages)) {
    if (subCategory !== 'default' && content.includes(subCategory.toLowerCase())) {
      return appendImageParameters(imageUrl as string);
    }
  }
  
  // Fall back to the default image for this category
  return appendImageParameters((categoryImages.default || campImages.default) as string);
};

// Helper function to check if a URL is likely a valid image URL
function isValidImageUrl(url: string): boolean {
  // Basic URL validation
  try {
    const parsedUrl = new URL(url);
    return true;
  } catch (e) {
    console.error("Invalid URL:", url);
    return false;
  }
}

// Add necessary parameters to optimize image loading
function appendImageParameters(url: string): string {
  // Check if the URL is from Unsplash and doesn't already have parameters
  if (url.includes('unsplash.com') && !url.includes('?')) {
    return `${url}?auto=format&fit=crop&w=800&q=60`;
  }
  return url;
}
