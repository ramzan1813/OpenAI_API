const dev = {
  baseURL: "http://localhost:3080/api/",
  landingPageUrl: "http://localhost:3080",
  stripe: {
    free: "price_1MQ9iZEKbjlHjR0pi3PIUsIc",
    entry: "price_1MQ9S1EKbjlHjR0p3sSrbAEO",
    pro: "price_1MQ9gQEKbjlHjR0pLyeXwktF",
  },
};

const prod = {
  baseURL: "/api/",
  landingPageUrl: "http://www.ramzankhan.tk",
  stripe: {
    free: "price_1MQB54JM381soXhGbx8Vl7Aa",
    entry: "price_1MQB7NJM381soXhGeLMRHq2N",
    pro: "price_1MQB7zJM381soXhGwn1jDcXW",
  },
};

const config =
  // process.env.NODE_ENV === 'development'	? dev	:
  prod;
  
export default config;