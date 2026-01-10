import { PrismaClient } from "@prisma/client";
import {DateTime} from "luxon";
import {addMinutes, isWithinInterval, areIntervalsOverlapping} from "date-fns"


const prisma = new PrismaClient()

interface Slot{
    start: Date,
    end: Date
}

export const getAvailableSlots = async(
    eventTypeId: string,
    startDate: Date,
    endDate: Date,
    guestTimezone: string = "UTC",
): Promise <Slot []> =>{
    
    const eventType = await prisma.eventType.findFirst({
        where: {id: eventTypeId},
        include:{availabilityRules: true, user: true}
    })

    if(!eventType) throw new Error("Event not Found")

    const hostTimezone = eventType.user?.timezone || "UTC"

    const existingBookings = await prisma.booking.findMany({
        where: {
            eventTypeId,
            startTime: {gte: startDate},
            endTime: {lte: endDate},
            status: "CONFIRMED"
        },
        select:{
            startTime: true,
            endTime: true
        }
    })
    
    const bookedIntervals = existingBookings.map(b => ({
        start: b.startTime,
        end: b.endTime
    }))

    const slots: Slot[] = []

    let current = DateTime.fromJSDate(startDate).setZone(hostTimezone).startOf("day")
    const end = DateTime.fromJSDate(endDate).setZone(hostTimezone).endOf("day")

    while(current <= end){
        const dayOfWeek = current.weekday

        const rules = eventType.availabilityRules.filter(
            r => r.dayOfWeek === dayOfWeek || r.dateOverride?.toDateString() === current.toJSDate().toDateString()
        )

        for (const rule of rules){
            let slotStart = DateTime.fromFormat(rule.startTime, "HH:mm", {zone: hostTimezone})
            .set({year: current.year, day: current.day, month: current.month})
            .toJSDate()

            let slotEnd = DateTime.fromFormat(rule.endTime, "HH:mm", {zone: hostTimezone})
            .set({year: current.year, day: current.day, month: current.month})
            .toJSDate()

            while(slotStart < slotEnd){
                const proposedEnd = addMinutes(slotStart, eventType.durationMinutes)

                if(proposedEnd > slotEnd) break

                const effectiveStart = addMinutes(slotStart, -eventType.bufferBeforeMinutes)
                const effectiveEnd = addMinutes(proposedEnd, eventType.bufferAfterMinutes)

                const isOverlapping = bookedIntervals.some(interval =>
                    areIntervalsOverlapping(
                        {start: effectiveStart, end: proposedEnd},
                        {start: interval.start, end: interval.end}
                    )
                )

                const dayStart = current.startOf("day").toJSDate()
                const dayEnd = current.endOf("day").toJSDate()

                const dayBookings = await prisma.booking.count({
                    where:{
                        eventTypeId,
                        startTime: {gte: dayStart, lte: dayEnd},
                        status: "CONFIRMED"
                    }
                })

                if(!isOverlapping && (!eventType.dailyLimit || dayBookings < eventType.dailyLimit)){
                    slots.push({start: slotStart, end: proposedEnd})
                }

                slotStart = proposedEnd
            }
        }
        current = current.plus({days: 1})
    }
    
    return slots
}   