import cron from "node-cron"
import {Resend} from "resend"
import { PrismaClient } from "@prisma/client"
import {DateTime} from "luxon"


const resend = new Resend(process.env.RESEND_API_KEY!)
const prisma = new PrismaClient()


cron.schedule("*/5 * * * *", async()=>{
    console.log("Checking for reminders..");
    
    const now = DateTime.utc()
    const in24h = now.plus({hours: 24})
    const in1h = now.plus({hours: 1})

    const need24h = await prisma.booking.findMany({
        where: {
            reminderSent24H: false,
            status: "CONFIRMED",
            startTime: {
                gte: now.toJSDate(),
                lte: in24h.toJSDate()
            }
        },
        include: {eventType: {include: {user: true}}}
    })

    const need1h = await prisma.booking.findMany({
        where: {
            reminderSent1H: false,
            status: "CONFIRMED",
            startTime: {
                gte: now.toJSDate(),
                lte: in1h.toJSDate()
            }
        },
        include: {eventType: {include: {user: true}}}
    })

    for(const booking of [...need24h, ...need1h]){
        const is24h = need24h.includes(booking)
        const timeText = is24h ? "24 hours" : "1 hour"

        const html = `
        <h2>Reminder: Your meeting is in ${timeText}</h2>
        <p>Hi ${booking.guestName},</p>
        <p>Your appointment with ${booking.eventType.user.name} is coming up soon!</p>
        <p><strong>When:</strong> ${DateTime.fromJSDate(booking.startTime)
            .setZone(booking.eventType.user.timezone || "UTC")
            .toFormat("cccc, LLLL dd 'at' h:mm a ZZZZ")}</p>
        <p><strong>Event:</strong> ${booking.eventType.title}</p>
        ${booking.videoLink ? `<p><strong>Join:</strong> <a href="${booking.videoLink}">Video Call</a></p>` : ''}
        `;
        await resend.emails.send({
        from: "onboarding@resend.dev",
        to: booking.guestEmail,
        subject: `Reminder: ${booking.eventType.title} in ${timeText}`,
        html,
        })

        if(is24h){
            await prisma.booking.update({
                where: {
                    id: booking.id
                },
                data: {
                    reminderSent24H: true
                }
            })
        }
        else{
            await prisma.booking.update({
                where: {
                    id: booking.id
                },
                data: {
                    reminderSent1H: true
                }
            })
        }
    }

    

})