export const APP_CONFIG = {
  app: {
    url: 'https://coffee-chat-bay.vercel.app/',
    name: 'Coffee Chat',
    description: 'Interactive chatbot that helps you find and purchase new products.',
    icon: '☕'
  },
  welcome: {
    title: 'Welcome to Coffee Chat',
    tagline: "Let's find your next favorite coffee.",
    suggestions: [
      {
        title: 'Find my perfect match',
        label: 'based on my taste',
        action: "I'd love to find a coffee that matches my taste. Help me discover what I enjoy and what I don't."
      },
      {
        title: 'Surprise me',
        label: 'discover something new!',
        action: "I'm feeling adventurous! Can you surprise me with an interesting coffee bean recommendation? I'm open to trying something unique and different."
      },
      {
        title: 'Explore origins',
        label: 'from around the world',
        action: "I'm curious about coffee from different parts of the world. Could you recommend some interesting beans from regions known for unique flavors?"
      },
      {
        title: 'Light & fruity',
        label: 'bright and vibrant beans',
        action: "I love light, fruity coffees with bright flavors. Could you help me find beans with notes of berries, citrus, or florals?"
      }
    ]
  },
  product: {
    unitLabel: 'per bag',
    recommendationLabel: '✨ Personalized Recommendation',
    noResultsText: 'No options found with the specified criteria.',
    loadingText: 'Loading selection...',
    previewTitle: 'Curated Selection'
  },
  checkout: {
    titles: {
      preview: 'Secure Checkout',
      error: 'Checkout Error',
      success: 'Order Confirmation'
    },
    messages: {
      error: 'Could not load checkout. Please try again or contact support if the problem persists.',
      success: 'Thank you for your purchase. We\'ll send your order details and confirmation to your email shortly.'
    },
    buttons: {
      buy: 'Buy Now',
      close: 'Close',
      done: 'Done'
    }
  }
} as const;

// Type for the config to ensure type safety
export type AppConfig = typeof APP_CONFIG; 