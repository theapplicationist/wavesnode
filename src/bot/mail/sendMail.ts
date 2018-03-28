import * as nodemailer from 'nodemailer'

export async function sendMail(to: string, subject: string, text: string) {
  return new Promise<boolean>((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      host: '194.226.19.86',
      port: 25,
      auth: {
        user: 'confirmation@bot.wavesplatform.com',
        pass: 'AtaXU8iqR6y0GAa6m3iFBPGiOGTkzwJhPxU67Pvxn5Ls'
      }
    })

    var mailOptions = {
      from: 'confirmation@bot.wavesplatform.com',
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