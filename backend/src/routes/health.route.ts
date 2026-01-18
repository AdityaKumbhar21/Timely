import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const router = Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error:any) {
    res.status(500).json({ status: "error", database: "disconnected", error: error.message });
  }
});

export default router;

