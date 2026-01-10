import { PrismaClient } from "@prisma/client";
import { addMinutes } from "date-fns";
import { Request,Response } from "express";
import { DateTime } from "luxon";
import { randomBytes } from "node:crypto";
import z from "zod";
import { sendConfirmationEmail } from "../services/email.service";

const prisma = new PrismaClient()

const bookingSchema = z.object({
    eventTypeId: z.string(),
    startTime: z.string().datetime(),
    guestName: z.string().min(2),
    guestEmail: z.email(),
    guestNotes: z.string().optional(),
    status: z.enum(["CONFIRMED", "CANCELLED" ,"RESCHEDULED"]),
    customAnswers: z.array(
        z.object({
            questionId: z.string(),
            answerText: z.string()
        })
    ).optional(),
    timezone: z.string().default("UTC"),
    videoLink: z.string().url().optional()
})

export const creatBooking = async(req: Request, res: Response) =>{
    const body = bookingSchema.parse(req.body)

    try {
        return await prisma.$transaction(async (tx)=>{
            const eventType = await tx.eventType.findUnique({
                where: {id: body.eventTypeId},
                include: {availabilityRules: true}
            })

            if(!eventType) throw new Error("Event type not found")
            
            const start = DateTime.fromISO(body.startTime, {zone: body.timezone}).toJSDate()
            const end = addMinutes(start, eventType.durationMinutes)

            const overlapping = await tx.booking.findFirst({
                where: {
                    eventTypeId: body.eventTypeId,
                    OR : [
                        {startTime: {lte: end},endTime: {gte: start} }
                    ],
                    status: "CONFIRMED"
                },
                
            })

            if(overlapping) throw new Error("Slot no longer available")

            const dayStart = DateTime.fromJSDate(start).startOf("day").toJSDate()
            const dayEnd = DateTime.fromJSDate(end).startOf("day").toJSDate()

            const dayCount = await tx.booking.count({
                where: {
                eventTypeId: body.eventTypeId,
                startTime: { gte: dayStart, lte: dayEnd },
                status: 'CONFIRMED',
                },
            });

            if (eventType.dailyLimit && dayCount >= eventType.dailyLimit) {
                throw new Error('Daily booking limit reached');
            }

            const cancellationToken = randomBytes(32).toString("hex")

            const finalVideoLink = body.videoLink || eventType.defaultVideoLink

            const booking = await tx.booking.create({
                data:{
                    eventTypeId: body.eventTypeId,
                    userId: eventType.userId,
                    guestName: body.guestName,
                    guestEmail: body.guestEmail,
                    guestNotes: body.guestNotes,
                    startTime: start,
                    endTime: end,
                    cancellationToken,
                    videoLink: finalVideoLink
                }
            })

            if(body.customAnswers?.length){
                await tx.customAnswer.createMany({
                    data: body.customAnswers.map(a => ({
                        bookingId: booking.id,
                        questionId: a.questionId,
                        answerText: a.answerText
                    }))
                })
            }
            
            const fullBooking = await tx.booking.findFirst({
                where: {id: booking.id},
                include:{
                    eventType: {
                        include:{
                            user: true
                        }
                    },

                }
            })
            
            if(fullBooking){
                await sendConfirmationEmail(fullBooking).catch(console.log)
            }

            return res.status(201).json({
                booking,
                message: "Booking comfirmed, check email."
            })
        })
        
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.message });
        }
        res.status(400).json({ error: error.message || 'Failed to create booking' });
    }
}