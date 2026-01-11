/*
  Warnings:

  - A unique constraint covering the columns `[eventTypeId,startTime,status]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Booking_eventTypeId_startTime_status_key" ON "Booking"("eventTypeId", "startTime", "status");
