const dev = {
	baseURL: "http://localhost:3080/api/",
	landingPageUrl: "http://localhost:3080",
	stripe: {
		free: "price_1MKISQKDl4BWQxUPCjluSykk",
		entry: "price_1MKISQKDl4BWQxUPCjluSykk",
		pro: "price_1MKIi0KDl4BWQxUPbknrrmEH"
	},
};
  
const prod = {
	baseURL: '/api/',
	landingPageUrl: "https://app.openaitemplate.com",
	stripe: {
		free: "price_1MKISQKDl4BWQxUPCjluSykk",
		entry: "price_1MKISQKDl4BWQxUPCjluSykk",
		pro: "price_1MKISQKDl4BWQxUPCjluSykk"
	},
};
  
const config = process.env.NODE_ENV === 'development'
	? dev
	: prod;
  
export default config;