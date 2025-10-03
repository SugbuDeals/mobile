import axios from "axios";

// Define the base URL for your API
// DO NOT TOUCH!
const API_BASE_URL = "https://server-onx3.onrender.com";

const instance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export default instance;
