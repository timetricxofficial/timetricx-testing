import { io } from "socket.io-client";

const socket = io(
  process.env.NODE_ENV === "production"
    ? "https://timetricx.cybershoora.com"
    : "http://localhost:3002",
  {
    path: "/api/socket",
    transports: ["websocket"],
    withCredentials: true,
  }
);

export default socket;