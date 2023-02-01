const dev = {
  baseURL: "http://localhost:3080/api/",
  landingPageUrl: "http://localhost:3000",
  stripe: {
    // free: "price_1MQ9iZEKbjlHjR0pi3PIUsIc",
    free: "price_1MVByXEKbjlHjR0pxuP4GSJO",
    entry: "price_1MVByXEKbjlHjR0pxuP4GSJO",
    pro: "price_1MVC1aEKbjlHjR0p1RXOZXDI",
  },
};

const prod = {
  baseURL: "/api/",
  landingPageUrl: "https://app.openaitemplate.com",
  stripe: {
    free: "price_1MQ9iZEKbjlHjR0pi3PIUsIc",
    entry: "price_1MQ9S1EKbjlHjR0p3sSrbAEO",
    pro: "price_1MQ9gQEKbjlHjR0pLyeXwktF",
  },
};

// const config = process.env.NODE_ENV === "development" ? dev : prod;
const config = dev;

export default config;
