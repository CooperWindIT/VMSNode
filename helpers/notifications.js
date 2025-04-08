const nodemailer = require("nodemailer");
const QRCode = require("qrcode");

class Notify {
    // Email function
    async sendEmail(FromEmail, ToEmails, CC, subject, text, html, attachments = []) {
        try {
            // Create transporter
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: "pavansai.nittu@gmail.com",//"info@cooperwindindia.in",
                    pass: "fgja gqyd jjdk ivmr"//"hgxv kbnt vuxp uwaz", // App Password
                },
            });

            // Ensure recipients are properly formatted
            const toEmailsFormatted = Array.isArray(ToEmails) ? ToEmails.join(",") : ToEmails;

            // Email options
            const mailOptions = {
                from: FromEmail,
                to: toEmailsFormatted,
                cc: CC,
                subject: subject,
                text: text,
                html: html,
                attachments: attachments, // Attachments array
            };

            console.log(mailOptions);

            // Send email
            const info = await transporter.sendMail(mailOptions);
            console.log("Email sent: " + info.response);
        } catch (error) {
            console.error("Error sending email:", error);
        }
    }

    // Function to send email to the manager
    async MailToManager(Results) {
        console.log(Results[0].NotifyEmail);
        await this.sendEmail(
            Results[0].FromEmail, 
            [Results[0].NotifyEmail],  
            Results[0].CC, 
            Results[0].Subject, 
            Results[0].Text, 
            Results[0].Html
        );
    }

    async OTPmail(Results) {
        await this.sendEmail(
            Results[0].FromEmail, 
            [Results[0].ToEmail],  
            Results[0].CC, 
            Results[0].Subject, 
            Results[0].Text, 
            Results[0].Html
        );
    }

    // Function to generate QR Code (Only Visitor ID)
    async generateQRCode(visitorId) {
        try {
            return await QRCode.toBuffer(visitorId.toString()); // Generate QR as buffer
        } catch (error) {
            console.error("Error generating QR Code:", error);
            throw error;
        }
    }

    // Function to send email to visitors with QR Code
    async CancelMailToVisitors(Results) {
        try {
            console.log(Results);
            await this.sendEmail(
                Results[0].FromEmail,
                [Results[0].ToEmail], // Convert to array
                Results[0].CC, // No CC in this case, provide an empty array
                Results[0].Subject,
                Results[0].Text,
                Results[0].Html
               
            );
        } catch (error) {
            console.error("Error in MailToVisitors:", error);
        }
    }

    //cancel mail
    async MailToVisitors(Results) {
        try {
            console.log("Generating QR Code for Visitor ID:", Results.VisitorId);
            const qrCodeBuffer = await this.generateQRCode(Results.VisitorId); // Generate QR code
            const subject = `${Results.Subject} 00${Results.VisitorId}`;
            await this.sendEmail(
                Results.FromEmail,
                [Results.NotifyEmail], // Convert to array
                Results.CC, // No CC in this case, provide an empty array
                subject,
                Results.Text,
                Results.Html,
                [
                    {
                        filename: `Visitor_QR_${Results.VisitorId}.png`,
                        content: qrCodeBuffer,
                        encoding: "base64",
                    },
                ]
            );
        } catch (error) {
            console.error("Error in MailToVisitors:", error);
        }
    }

    // Function to send Check-in/Check-out email
    async MailCheckInOut(Results) {
        console.log(Results[0].NotifyEmail);
        
        // Send email to the visitor
        await this.sendEmail(
            Results[0].FromEmail, 
            [Results[0].NotifyEmail],  
            Results[0].CC, 
            Results[0].Subject, 
            Results[0].Text, 
            Results[0].Html
        );
    
        // Send email to employee only if EmpSubject exists
        if (Results[0].EmpSubject) {
            await this.sendEmail(
                Results[0].FromEmail, 
                [Results[0].NotifyEmail],  
                Results[0].CC, 
                Results[0].EmpSubject, 
                Results[0].EmpText, 
                Results[0].EmpHtml
            );
        } else {
            console.log("Skipping employee notification as EmpSubject is missing.");
        }
    }
    
}

module.exports = new Notify();


// const nodemailer = require("nodemailer");

// class Notify {
//     // Email function
//     async sendEmail(FromEmail, ToEmails, CC, subject, text, html) {
//         try {
//             // Create transporter
//             const transporter = nodemailer.createTransport({
//                 service: "gmail",
//                 auth: {
//                     user: "info@cooperwindindia.in",
//                     pass: "hgxv kbnt vuxp uwaz", // Your App Password
//                 },
//             });

//             // Ensure recipients are properly formatted
//             const toEmailsFormatted = Array.isArray(ToEmails) ? ToEmails.join(",") : ToEmails;

//             // Email options
//             const mailOptions = {
//                 from: FromEmail,
//                 to: toEmailsFormatted,
//                 cc: CC,
//                 subject: subject,
//                 text: text,
//                 html: html
//             };

//             console.log(mailOptions);

//             // Send email
//             const info = await transporter.sendMail(mailOptions);
//             console.log("Email sent: " + info.response);
//         } catch (error) {
//             console.error("Error sending email:", error);
//         }
//     }

//     // Function to send email to the manager
//     async MailToManager(Results) {
//         console.log(Results[0].NotifyEmail);
//         await this.sendEmail(
//             Results[0].FromEmail, 
//             [Results[0].NotifyEmail],  
//             Results[0].CC, 
//             Results[0].Subject, 
//             Results[0].Text, 
//             Results[0].Html
//         );
//     }

//     async MailToVisitors(Results) {
//     console.log('hi');
//     const a =  Results.VisitorId;
//     await this.sendEmail(
//         Results.FromEmail, 
//         [Results.NotifyEmail],  // Convert to array
//         Results.CC, // No CC in this case, provide an empty array
//         Results.Subject, 
//         Results.Text, 
//         Results.Html
//     );}


//     // Function to send Check-in/Check-out email
//     async MailCheckInOut(Results) {
//         console.log(Results[0].NotifyEmail);
//         await this.sendEmail(
//             Results[0].FromEmail, 
//             [Results[0].NotifyEmail],  
//             Results[0].CC, 
//             Results[0].Subject, 
//             Results[0].Text, 
//             Results[0].Html
//         );

//         // Send email to employee
//         await this.sendEmail(
//             Results[0].FromEmail, 
//             [Results[0].NotifyEmail],  
//             Results[0].CC, 
//             Results[0].EmpSubject, 
//             Results[0].EmpText, 
//             Results[0].EmpHtml
//         );
//     }
// }

// module.exports = new Notify();
