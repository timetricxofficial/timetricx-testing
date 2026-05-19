// import { io } from "socket.io-client";

// const socket = io(
//   process.env.NODE_ENV === "production"
//     ? "https://timetricx.cybershoora.com"
//     : "http://localhost:3002",
//   {
//     path: "/api/socket",
//     transports: ["websocket"],
//     withCredentials: true,
//   }
// );

// export default socket;
import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NODE_ENV === "production"
    ? "https://timetricx-testing.vercel.app"
    : "http://localhost:3002";

const socket = io(SOCKET_URL, {
  path: "/api/socket",
  transports: ["polling", "websocket"],
  withCredentials: true,
});

export default socket;