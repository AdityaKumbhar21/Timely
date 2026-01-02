import {Resend} from "resend"


const resend = new Resend(process.env.RESEND_API_KEY)

export const sendVerificationEmail = async(email: string, name: string, code: string) =>{
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?code=${code}&email=${email}`

    await resend.emails.send({
        from: 'Timely <no-reply@yourdomain.com>',
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
        from: 'Timely <no-reply@yourdomain.com>',
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