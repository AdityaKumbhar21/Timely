import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import authRoutes from './routes/auth.routes';
import eventTypeRoutes from "./routes/eventType.routes"
import userRoutes from "./routes/user.routes"
import publicRoutes from "./routes/public.routes"
import availabilityRoutes from "./routes/availability.routes"
import bookingRoutes from "./routes/booking.routes"
import './jobs/reminder.job'

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:5001'],
  credentials: true,
}));

app.use('/api/auth', authRoutes);
app.use('/api/event-type', eventTypeRoutes);
app.use("/api/user", userRoutes)
app.use("/api/public", publicRoutes)
app.use("/api/availability", availabilityRoutes)
app.use("/api/booking", bookingRoutes)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});