import { Booking, EventType, User } from "@prisma/client"
import { DateTime } from "luxon"
import {Resend} from "resend"
import { formatBookingTime } from "../utils/dateFormat"

const resend = new Resend(process.env.RESEND_API_KEY!)

interface BookingWithRelations extends Booking{
    eventType: EventType & {user: User}
}

export const sendVerificationEmail = async(email: string, name: string, code: string) =>{
    const verificationLink = `${process.env.FRONTEND_URL}/verify?code=${code}&email=${encodeURIComponent(email)}`

    await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Verify your Timely account',
        html: `
        <h2>Welcome ${name}!</h2>
        <p>Click the link below to verify your email:</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>Code: <strong>${code}</strong></p>
        <p>This link expires in 24 hours.</p>
        `,
    })
}

export const sendPasswordResetEmail = async(email: string, token: string) =>{
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

    await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Reset your Timely password',
        html: `
        <h2>Password Reset Request</h2>
        <p>Click below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, ignore this email.</p>
        `,
    });
}

export const sendConfirmationEmail = async(booking: BookingWithRelations) =>{
    const {guestName, guestEmail, startTime, endTime, eventType} = booking
    const host = eventType.user
    const hostName = host.name || host.username
    const hostEmail = host.email
    const eventTitle = eventType.title
    const duration = eventType.durationMinutes
    const hostTimeZone = host.timezone || "UTC"
    

    const guestStartDateTime = DateTime.fromJSDate(startTime).setZone("UTC").toJSDate()
    const hostStartDateTime = DateTime.fromJSDate(startTime).setZone(hostTimeZone).toJSDate()

    const guestConfirmationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Booking Confirmed!</h2>
        <p>Hi ${guestName},</p>
        <p>Your appointment has been successfully booked with <strong>${hostName}</strong>.</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <strong>Event:</strong> ${eventTitle}<br>
            <strong>When:</strong> ${guestStartDateTime}<br>
            <strong>Duration:</strong> ${duration} minutes<br>
            ${eventType.locationDetails ? `<strong>Location:</strong> ${eventType.locationDetails}<br>` : ''}
        </div>

        <p>You will receive a reminder 24 hours and 1 hour before the meeting.</p>
        <p><strong>Important:</strong> To <strong>reschedule or cancel</strong>, use the link in your confirmation email.</p>

        <p style="margin-top: 30px;">Thank you for using Timely!</p>
        <p style="color: #666; font-size: 14px;">
            ${process.env.APP_NAME} • <a href="${process.env.FRONTEND_URL}">Visit website</a>
        </p>
        </div>
    `;

    const hostNotificationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Booking on Timely</h2>
        <p>Hi ${hostName},</p>
        <p>You have a new booking from <strong>${guestName}</strong> (${guestEmail}).</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <strong>Event:</strong> ${eventTitle}<br>
            <strong>When:</strong> ${hostStartDateTime}<br>
            <strong>Guest:</strong> ${guestName} (${guestEmail})<br>
            ${booking.guestNotes ? `<strong>Notes:</strong> ${booking.guestNotes}<br>` : ''}
        </div>

        <p>You can view all bookings in your <a href="${process.env.FRONTEND_URL}/dashboard">dashboard</a>.</p>

        <p style="margin-top: 30px;">Happy scheduling!</p>
        <p style="color: #666; font-size: 14px;">
            ${process.env.APP_NAME} Team
        </p>
        </div>
    `;

    try {
        await resend.emails.send({
            from: "onboarding@resend.dev",
            to: guestEmail,
            subject: `Your booking with ${hostName} is confirmed`,
            html: guestConfirmationHtml
        })

        await resend.emails.send({
            from: "onboarding@resend.dev",
            to: hostEmail,
            subject: `New Booking:  ${guestName} - ${eventTitle}`,
            html: hostNotificationHtml
        })

    } catch (error) {
        console.log('Failed to send confirmation emails:', error);
    }
}

export const sendCancellationEmails = async (booking: BookingWithRelations) => {
  const { guestName, guestEmail, startTime, eventType } = booking;
  const host = eventType.user;
  const hostName = host.name || host.username;
  const hostEmail = host.email;
  const eventTitle = eventType.title;
  const hostTimeZone = host.timezone || "UTC";

  const guestCancellationHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Booking Cancelled</h2>
      <p>Hi ${guestName},</p>
      <p>Your booking with <strong>${hostName}</strong> has been cancelled.</p>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <strong>Event:</strong> ${eventTitle}<br>
        <strong>Original time:</strong> ${formatBookingTime(startTime, 'UTC')}<br>
      </div>

      <p>If you'd like to reschedule, please visit our website to book a new time.</p>

      <p style="margin-top: 30px;">Thank you for using Timely!</p>
      <p style="color: #666; font-size: 14px;">
        ${process.env.APP_NAME} • <a href="${process.env.FRONTEND_URL}">Visit website</a>
      </p>
    </div>
  `;

  const hostCancellationHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Booking Cancellation Notice</h2>
      <p>Hi ${hostName},</p>
      <p><strong>${guestName}</strong> (${guestEmail}) has cancelled their booking.</p>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <strong>Event:</strong> ${eventTitle}<br>
        <strong>Original time:</strong> ${formatBookingTime(startTime, hostTimeZone)}<br>
      </div>

      <p>You can view all bookings in your <a href="${process.env.FRONTEND_URL}/dashboard">dashboard</a>.</p>

      <p style="margin-top: 30px;">Thank you for using Timely!</p>
      <p style="color: #666; font-size: 14px;">
        ${process.env.APP_NAME} Team
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: guestEmail,
      subject: `Your booking with ${hostName} has been cancelled`,
      html: guestCancellationHtml,
    });

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: hostEmail,
      subject: `Booking Cancelled: ${guestName} - ${eventTitle}`,
      html: hostCancellationHtml,
    });
  } catch (error) {
    console.log('Failed to send cancellation emails:', error);
  }
};