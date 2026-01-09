import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import authRoutes from './routes/auth.routes';
import eventTypeRoutes from "./routes/eventType.routes"
import userRoutes from "./routes/user.routes"
import publicRoutes from "./routes/public.routes"

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/event-type', eventTypeRoutes);
app.use("/api/user", userRoutes)
app.use("/api/public", publicRoutes)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});