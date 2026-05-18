// import { Server as NetServer } from "http";
// import { NextApiRequest } from "next";
// import { Server as ServerIO } from "socket.io";
// import { NextApiResponse } from "next";

// export type NextApiResponseServerIO = NextApiResponse & {
//   socket: any & {
//     server: NetServer & {
//       io: ServerIO;
//     };
//   };
// };

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
//   if (!res.socket.server.io) {
//     console.log("Setting up socket.io server...");
//     const io = new ServerIO(res.socket.server, {
//       path: "/api/socket",
//       addTrailingSlash: false,
//       cors: {
//         origin: [
//           "https://timetricx.cybershoora.com",
//           "https://ttadmin.cybershoora.com",
//           "http://localhost:3000",
//           "http://localhost:3002"
//         ],
//         methods: ["GET", "POST"],
//         credentials: true
//       }
//     });

//     io.on("connection", (socket) => {
//       console.log("Client connected:", socket.id);

//       // Join a specific room based on user ID
//       socket.on("join_room", (userId: string) => {
//         socket.join(userId);
//         console.log(`User ${userId} joined room ${userId}`);
//       });

//       // Listen for admin's presence check request
//       socket.on("admin_request_presence", ({ userId, adminId }: { userId: string, adminId: string }) => {
//         console.log(`Admin ${adminId} requesting presence for user ${userId}`);
//         // Emit to the specific user's room
//         io.to(userId).emit("trigger_face_verification", { adminId });
//       });

//       // Optional: Handle verification results to notify admin
//       socket.on("verification_result", ({ userId, adminId, status, score }: any) => {
//         console.log(`Verification result for ${userId}: ${status}`);
//         io.to(adminId).emit("user_presence_result", { userId, status, score });
//       });

//       socket.on("disconnect", () => {
//         console.log("Client disconnected");
//       });
//     });

//     res.socket.server.io = io;
//   }

//   res.end();
// };

// export default ioHandler;
// /pages/api/socket.ts

import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponse } from "next";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: any & {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {

    console.log("🔥 Main Socket Server Running");

    const io = new ServerIO(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: [
          "https://timetricx.cybershoora.com",
          "https://ttadmin.cybershoora.com",
          "http://localhost:3003",
          "http://localhost:3002",
        ],
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    io.on("connection", (socket) => {

      console.log("✅ Connected:", socket.id);

      // JOIN ROOM
      socket.on("join_room", (roomId: string) => {
        socket.join(roomId);

        console.log(`🚀 ${socket.id} joined room: ${roomId}`);
      });

      // ADMIN -> USER
      socket.on(
        "admin_request_presence",
        ({ userId, adminId }) => {

          console.log(`📢 Admin ${adminId} requesting ${userId}`);

          io.to(userId).emit(
            "trigger_face_verification",
            { adminId }
          );
        }
      );

      // USER -> ADMIN
      socket.on(
        "verification_result",
        ({ userId, adminId, status, score, userName }) => {

          console.log("🎯 Verification Result:", {
            userId,
            adminId,
            status,
          });

          io.to(adminId).emit(
            "user_presence_result",
            {
              userId,
              status,
              score,
              userName,
            }
          );
        }
      );

      socket.on("disconnect", () => {
        console.log("❌ Disconnected:", socket.id);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export default ioHandler;