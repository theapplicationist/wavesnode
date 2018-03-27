import * as nodemailer from 'nodemailer'

export async function sendMail(to: string, subject: string, text: string) {
  return new Promise<boolean>((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      host: 'email-smtp.eu-west-1.amazonaws.com',
      port: 587,
      auth: {
        user: 'AKIAJZHXVEFNG6QNMLQQ',
        pass: 'AtaXU8iqR6y0GAa6m3iFBPGiOGTkzwJhPxU67Pvxn5Ls'
      }
    })

    var mailOptions = {
      from: 'success@simulator.amazonses.com',
      to,
      subject,
      text
    }

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        resolve(false)
        console.log(error);
      } else {
        resolve(true)
      }
    })
  })
}