const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const router = express.Router();
const { handleRecord } = require('../helpers/RecordHandler.js');
const { OperationEnums } = require('../helpers/utilityEnum.js');
const exeQuery = require('../helpers/exeQuery');
const dbUtility = require('../dbUtility');
const { Console } = require('winston/lib/winston/transports/index.js');

const upload = multer({ dest: 'uploads/' }); 
router.use(express.json());


// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'info@cooperwindindia.in', 
        pass: 'hgxv kbnt vuxp uwaz'       // Your App Password
    }
});

//#region Departments
router.get('/getDepts', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().GETDEPT);
});
//#end region Departments


//#region Menu

router.get('/UserPermissions', (req, res) => {
    const {OrgId, RoleId, ModuleId } = req.query;
    const data = { "OrgId": OrgId, "RoleId":RoleId, "ModuleId": ModuleId };
    handleRecord(req, res, data, OperationEnums().RSECURSEL);
});

router.get('/getmenu', (req, res) => {
    const {OrgId, RoleId } = req.query;
    const JsonData = { "OrgId": OrgId, "RoleId":RoleId };
    exeQuery.GetMenu(JsonData, (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        //console.log(results);
        exeQuery.GetMenuNodes(results, (err, MenuList) => {
            if (err) {
                return res.status(500).json({ error: err.message, Status: false });
            }
            res.json({
                ResultData: MenuList,
                Status: true
            });
        });
    });
});
router.post('/UpdateUserMenu', (req, res) => {
    const UpdateJson = req.body; 
     exeQuery.SpSetRoleSecurity(UpdateJson, (error, results) => {
        if (error) {
           res.status(400).send({ error: error.message });
          return;
       }
       res.status(200).send(results);
    });      
});


router.post('/InactiveRoleMenu', async (req, res)=>{
    const data = req.body;
    handleRecord(req, res, data, OperationEnums().DELTROLMNU);
});
//#endregion Menu

//#region Users
router.get('/SignIn', (req, res) => {
try {
    const data = req.query;
    console.log(data);
    handleRecord(req, res, data, OperationEnums().SIGNIN);
} catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Error While SIGNIN' });
}
});

router.get('/LogIn', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().LOGIN);
});

router.post('/LogOut', async (req, res) => {
    const data = req.body;
    handleRecord(req, res, data, OperationEnums().LOGOUT);
});

// router.post('/POSTUsers', async (req, res)=>{
//     const data = req.body;
//     const 
//     handleRecord(req, res, data, OperationEnums().ADDUSER);
// });

router.post('/POSTUsers', async (req, res) => {
    const data = req.body;
    handleRecord(req, res, data, OperationEnums().ADDUSER);
});




router.post('/forgotPassword', async (req, res)=>{
    const data = req.body;
    handleRecord(req, res, data, OperationEnums().FRGTPASWRD);
});

router.post('/UPDTUsers', async (req, res)=>{
    const data = req.body;
    handleRecord(req, res, data, OperationEnums().UPDTUSER);
});

router.get('/getUsers', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().GETUSERS);
});
router.post('/UsersInActive', async (req, res) => {
    const data = req.body; 
    handleRecord(req, res, data, OperationEnums().DELTUSER);
});

router.get('/getRoles', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().GETROLES);
});
//#endregion Users

//#region Manual Check IN/OUT
router.post('/PassCheckIn', async (req, res)=>{
    const data = req.body;
    handleRecord(req, res, data, OperationEnums().PASSCHECKIN);
});
router.post('/PassCheckOut', async (req, res)=>{
    const data = req.body;
    handleRecord(req, res, data, OperationEnums().PASSCHECKOUT);
});

//#endregion Manual Check IN/OUT

// Email Service
router.post('/send-email', async (req, res) => {
    const { to, subject, text, html } = req.body;
    
    // Email options
    const mailOptions = {
        from: '"CWI" <info@cooperwindindia.in>', // Sender's name and email
        to: to,                                     // Recipient email
        subject: subject,                           // Email subject
        text: text,                                 // Plain text body
        html: html                                  // HTML body
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        res.status(200).json({ message: 'Email sent successfully', info: info.response });
    } catch (error) {
        console.error('Error while sending email:', error);
        res.status(500).json({ message: 'Error while sending email', error: error.message });
    }
});

//#region ManageRequestPass
router.post('/ManageRequestPass', async (req, res) => {
    try {
    
        if (!req.body || !req.body.orgid || !req.body.userid || !req.body.Operation || !req.body.RequestPass || !req.body.Attendees) {
            return res.status(400).send({ error: 'Missing required parameters' });
        }

        exeQuery.SpManageRequestPass(req.body, (error, results) => {
            if (error) {
                res.status(400).send({ error: error.message });
                return;
            }

            res.status(200).send(results);
        });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});




router.get('/getReqPass', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().GETREQPASS);
});
//#region filter service
router.post('/getReqPasswithFilters', async (req, res) => {
    try {
        // Destructuring parameters from the request body
        const { OrgId, FromDate, ToDate, VisitorType, Status, AutoIncNo, UserId, RoleId } = req.body;

        // Validate OrgId
        if (!OrgId) {
            return res.status(400).json({ message: 'OrgId is required', Status: false });
        }

        // Start building the query string
        let query = `
            SELECT RequestId, VisitorName, RequestDate, CAST(MeetingDate AS DATE) AS MeetingDate,
                   FORMAT(CAST(MeetingDate AS DATE), 'dd-MM-yyyy') AS FormattedMeetingDate, 
                   NoOfMembers, VisitorType, Status, AutoIncNo, VehicleInfo, Email, Mobile, Remarks 
            FROM dbo.RequestPass 
            WHERE OrgId = ${OrgId} 
            AND IsActive = 1`;

        // Role-based filtering
        if (RoleId === 4) { // Security
            query += ` AND Status IN ('APPROVED','CHECKIN')  AND MeetingDate = CAST(GETDATE() AS DATE)`;
        } else if (RoleId === 2) { // HR
            query += ` AND Status IN ('REJECTED', 'DRAFT')`;
        } else if (RoleId === 3) { // Employee
            query += ` AND CreatedBy = ${UserId}`;
        }

        // Adding optional filters dynamically
        if (FromDate != 0) {
            query += ` AND CAST(MeetingDate AS DATE) BETWEEN '${FromDate}' AND '${ToDate}'`;
        }
        if (VisitorType != 0) {
            query += ` AND VisitorType = ${VisitorType}`;
        }
        if (Status != 0) {
            query += ` AND Status = '${Status}'`;
        }
        if (AutoIncNo != 0) {
            query += ` AND AutoIncNo = '${AutoIncNo}'`;
        }

        // Append ORDER BY clause
        query += ` ORDER BY RequestId DESC`;

        // Debugging: log the constructed query
        console.log('Generated Query:', query);

        // Execute query using the constructed query string
        const results = await dbUtility.executeQuery(query);

        // Send response
        if (results && results.length > 0) {
            return res.status(200).json(results);
        } else {
            return res.status(404).json({ message: 'No records found', Status: false });
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Error fetching data', Status: false });
    }
});


router.post('/ChangePassword', async (req, res)=>{
    const data = req.body;
    handleRecord(req, res, data, OperationEnums().FRGTPASWRD);
});

router.get('/getReqPassById', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().GETREQPASSBYID);
});
/*
router.post('/MOMSubmit', async (req, res) => {
    const data = req.body;
    const { MOM, RequestId, UpdatedBy } = req.body;

    if (!MOM || !RequestId || !UpdatedBy) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Handle record processing for MOM submission
    //handleRecord(req, res, data, OperationEnums().MOMSUBMIT);

    // SQL query to update MOM and Status in the database
    const updateMOMQuery = `
        UPDATE dbo.RequestPass 
        SET MOM = '${MOM}', 
            Status = 'COMPLETED', 
            UpdatedBy = '${UpdatedBy}', 
            UpdatedOn = dbo.GetISTTime()
        WHERE RequestId = '${RequestId}';
    `;
    
    try {
        const rowsAffected = await dbUtility.executeQueryrowsAffected(updateMOMQuery);

        // Check if any rows were affected (i.e., update was successful)
        if (rowsAffected > 0) {
            const GetPassQuery = `
                SELECT * 
                FROM dbo.RequestPass 
                WHERE RequestId = ${RequestId}
            `;
            
            const recordData = await dbUtility.executeQuery(GetPassQuery);
            const record = recordData[0];

            // Email options if MOM is updated
            const to = record.Email;
            const Passno = record.AutoIncNo;
            const subject = `MOM Submission for Pass ${Passno}`;
            const text = `MOM submission for Pass ${Passno}.`;
            const html = `
                <p>MOM Submission,</p>
                <p>${MOM}.</p>
                <p>Thank you,</p>
                <p>VMS Cooperwind</p>
            `;

            const mailOptions = {
                from: '"Gireesh" <yaswanthpg9@gmail.com>', // Sender's name and email
                to: to,
                subject: subject,
                text: text,
                html: html
            };

            // Send the email
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent:', info.response);

            return res.status(200).json({
                message: 'MOM Updated and email sent successfully',
                Status: true,
                emailResponse: info.response
            });
        } else {
            return res.status(200).json({
                message: 'MOM not updated, no email sent',
                Status: false
            });
        }
    } catch (error) {
        console.error('Error while updating MOM or sending email:', error);
        return res.status(500).json({
            message: 'Error while updating MOM or sending email',
            Status: false,
            error: error.message
        });
    }
});*/

router.post('/MOMSubmit', async (req, res) => {
    const data = req.body;
    const { MOM, RequestId, UpdatedBy } = req.body;

    if (!MOM || !RequestId || !UpdatedBy) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // SQL query to update MOM and Status in the database
    const updateMOMQuery = `
        UPDATE dbo.VisitorsPass 
        SET MOM = '${MOM}', 
            Status = 'COMPLETED', 
            UpdatedBy = '${UpdatedBy}', 
            UpdatedOn = dbo.GetISTTime()
        WHERE RequestId = '${RequestId}';
    `;

    try {
        const rowsAffected = await dbUtility.executeQueryrowsAffected(updateMOMQuery);
        console.log(rowsAffected);
        // Check if any rows were affected (i.e., update was successful)
        if (rowsAffected > 0) {
            res.status(200).json({
                message: 'MOM Updated successfully. Emails will be sent shortly.',
                Status: true
            });
            console.log('HI');
            // Email sending logic in the background
            setImmediate(async () => {
                try {
                   
                    const GetPassQuery = `
                        SELECT * FROM dbo.VisitorsDetails WHERE RequestId = '${RequestId}'
                    `;
                    console.log(GetPassQuery);
                    const records = await dbUtility.executeQuery(GetPassQuery);
                
                    if (records.length > 0) {
                        for (const record of records) {
                            console.log(record[0].Email);
                            if (record.Email) {
                                const to = record.Email;
                                const Passno = record.AutoIncNo;
                                const subject = `MOM Submission for Pass ${Passno}`;
                                const text = `MOM submission for Pass ${Passno}.`;
                                const html = `
                                    <p>MOM Submission,</p>
                                    <p>${MOM}.</p>
                                    <p>Thank you,</p>
                                    <p>VMS Cooperwind</p>
                                `;

                                const mailOptions = {
                                    from: '"CWI" <info@cooperwindindia.in>', // Sender's name and email
                                    to: to,
                                    subject: subject,
                                    text: text,
                                    html: html
                                };

                                // Send the email
                                const info = await transporter.sendMail(mailOptions);
                                console.log(`Email sent to ${to}:`, info.response);
                            } else {
                                console.warn('No email found for RequestId:', RequestId);
                            }
                        }
                    } else {
                        console.warn('No records found for RequestId:', RequestId);
                    }
                } catch (error) {
                    console.error('Error while fetching records or sending emails:', error);
                }
            });
        } else {
            res.status(200).json({
                message: 'MOM not updated, no emails will be sent',
                Status: false
            });
        }
    } catch (error) {
        console.error('Error while updating MOM:', error);
        res.status(500).json({
            message: 'Error while updating MOM',
            Status: false,
            error: error.message
        });
    }
});



router.post('/AttendeInActive', async (req, res) => {
    const data = req.body; 
    handleRecord(req, res, data, OperationEnums().ADETAIL);
});

//#endregion ManageRequestPass


//region PassApproval&Email
const fs = require('fs');
/*
router.post('/PassApproval&Email', upload.single('file'), async (req, res) => {
    const { RequestId, Status, UserId, to, html, text } = req.body;
    const subject = 'Welcome to CooperWind India,';

    // Validate required fields
    if (!RequestId || !UserId) {
        return res.status(400).json({ message: 'Missing required fields', Status: false });
    }

    // Check if an attachment was uploaded
    const file = req.file;
    if (!file) {
        return res.status(400).json({ message: 'Attachment file is required', Status: false });
    }
    const GetPassQuery = `
    select RP.*,US.Email as Useremail from dbo.RequestPass RP Inner join dbo.Users US ON 
RP.CreatedBy = US.Id 
    WHERE RequestId = ${RequestId} 
    `;
    console.log(GetPassQuery);

    const recordData = await dbUtility.executeQuery(GetPassQuery);
    const record = recordData[0]; 

    // SQL query to update status
    const updateStatusQuery = `
        UPDATE dbo.RequestPass
        SET Status = 'APPROVED',
            UpdatedBy = '${UserId}',
            UpdatedOn = dbo.GetISTTime()
        WHERE RequestId = '${RequestId}'
    `;

    try {
        const rowsAffected = await dbUtility.executeQueryrowsAffected(updateStatusQuery);

        if (rowsAffected === 0) {
            return res.status(200).json({ message: 'Status not updated', Status: false });
        }

        // Check if email should be sent
        if (Status?.toLowerCase() === 'approved') {
            try {
                const mailOptions = {
                    from: '"Gireesh" <yaswanthpg9@gmail.com>',
                    to: to,
                    subject: subject,
                    text: text,
                    html: html,
                    attachments: [
                        {
                            filename: file.originalname,
                            path: file.path,
                        },
                    ],
                };

                const info = await transporter.sendMail(mailOptions);
                console.log('Email sent:', info.response);

                // Clean up temporary file
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Failed to delete temporary file:', err);
                });

                return res.status(200).json({
                    message: 'Status updated and email sent successfully',
                    Status: true,
                    emailResponse: info.response,
                });
            } catch (emailError) {
                console.error('Error while sending email:', emailError);
                return res.status(500).json({
                    message: 'Status updated, but email sending failed',
                    Status: false,
                    error: emailError.message,
                });
            }
        }

        res.status(200).json({
            message: 'Status updated successfully',
            Status: true,
        });
    } catch (dbError) {
        console.error('Database error:', dbError);
        res.status(500).json({
            message: 'Error while updating status',
            Status: false,
            error: dbError.message,
        });
    }
});*/



router.post('/PassApproval&Email', upload.single('file'), async (req, res) => {
    const { RequestId, Status, UserId } = req.body;

    // Validate required fields
    if (!RequestId || !UserId) {
        return res.status(400).json({ message: 'Missing required fields', Status: false });
    }

    // Check if an attachment was uploaded
    const file = req.file;
    if (!file) {
        return res.status(400).json({ message: 'Attachment file is required', Status: false });
    }

    const GetPassQuery = `
        SELECT RP.*, US.Email AS UserEmail
        FROM dbo.RequestPass RP
        INNER JOIN dbo.Users US ON RP.CreatedBy = US.Id
        WHERE RequestId = ${RequestId};
    `;

    try {
        const recordData = await dbUtility.executeQuery(GetPassQuery);
        const record = recordData[0];
        if (!record) {
            return res.status(404).json({ message: 'Request record not found', Status: false });
        }

        // Update status query
        const updateStatusQuery = `
            UPDATE dbo.RequestPass
            SET Status = 'APPROVED',
                UpdatedBy = '${UserId}',
                UpdatedOn = dbo.GetISTTime()
            WHERE RequestId = '${RequestId}';
        `;
        const rowsAffected = await dbUtility.executeQueryrowsAffected(updateStatusQuery);

        if (rowsAffected === 0) {
            return res.status(200).json({ message: 'Status not updated', Status: false });
        }

        // Respond to the client immediately
        res.status(200).json({
            message: 'Status updated successfully',
            Status: true,
        });

        // If the status is approved, proceed to send the email in the background
        if (Status?.toLowerCase() === 'approved') {
            // Prepare email content
            const subject = 'Welcome to CooperWind India';
            const htmlContent = `
                <p>Dear ${record.VisitorName},</p>
                <p>We are pleased to welcome you to the CWI facility, a leading manufacturer of Tower Internals. 
                We appreciate your interest in learning more about our operations and look forward to sharing our facilities with you.</p>
                <p><strong>Health and Safety:</strong></p>
                <ul>
                    <li>Report to the reception desk upon arrival for your badge and safety briefing.</li>
                    <li>Wear closed-toe shoes and avoid loose clothing.</li>
                    <li>Follow instructions from staff and supervisors.</li>
                </ul>
                <p><strong>Schedule:</strong><br>Date: ${record.MeetingDate}</p>
                <p><strong>Additional Information:</strong></p>
                <ul>
                    <li>Parking: Available on-site, follow signs to visitor parking.</li>
                    <li>Restrooms: Located on the North side of the factory.</li>
                    <li>Photography: Refrain from taking photos without permission.</li>
                </ul>
                <p>If you have specific requests or requirements, let us know in advance. Your visit will be informative, safe, and enjoyable.</p>
                <p>We look forward to welcoming you soon!</p>
                <p>Best regards,<br>CWI Admin</p>
            `;
            const textContent = `
                Dear ${record.VisitorName},

                We are pleased to welcome you to the CWI facility, a leading manufacturer of Tower Internals. We appreciate your interest in learning more about our operations and look forward to sharing our facilities with you.

                Health and Safety:
                - Report to the reception desk upon arrival for your badge and safety briefing.
                - Wear closed-toe shoes and avoid loose clothing.
                - Follow instructions from staff and supervisors.

                Schedule:
                Date: ${record.MeetingDate}

                Additional Information:
                - Parking: Available on-site, follow signs to visitor parking.
                - Restrooms: Located on the North side of the factory.
                - Photography: Refrain from taking photos without permission.

                If you have specific requests or requirements, let us know in advance. Your visit will be informative, safe, and enjoyable.

                We look forward to welcoming you soon!

                Best regards,
                CWI Admin
            `;

            const mailOptions = {
                from: '"CWI" <info@cooperwindindia.in>',
                to: record.Email,
                subject: subject,
                text: textContent,
                html: htmlContent,
                attachments: [
                    {
                        filename: file.originalname,
                        path: file.path,
                    },
                ],
            };

            try {
                const info = await transporter.sendMail(mailOptions);
                console.log('Email sent:', info.response);

                // Clean up temporary file
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Failed to delete temporary file:', err);
                });
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
            }
        }
    } catch (error) {
        console.error('Error:', error);

        // Send the error response only if response isn't already sent
        if (!res.headersSent) {
            res.status(500).json({
                message: 'An error occurred',
                Status: false,
                error: error.message,
            });
        }
    }
});



//#endregion PassApproval&email

//#region QrCheckin
router.post('/QrCheckinOrCheckOut', async (req, res) => {
    try {
        const { OrgId, IncNo, UserId, currentTime } = req.body;
        if (!OrgId || !IncNo || !UserId || !currentTime) 
            return res.status(400).json({ error: 'Invalid input data' });

        const GetPassQuery = `
            SELECT RP.*, Us.Email AS EmpEmail, Us.Name 
            FROM dbo.RequestPass RP 
            INNER JOIN dbo.Users Us ON RP.CreatedBy = Us.Id
            WHERE RP.OrgId = ${OrgId} 
              AND AutoIncNo = '${IncNo}' 
              AND CAST(MeetingDate AS DATE) = CAST(GETDATE() AS DATE);
        `;
        console.log(GetPassQuery);
        const recordData = await dbUtility.executeQuery(GetPassQuery);
        if (!recordData.length) return res.status(404).json({ error: 'No active record found' });

        const record = recordData[0];
        let updateQuery, subject, text, html, empSubject, empText, empHtml;
        let responseMessage = '';
        if (!record.CheckInTime) {
            updateQuery = `
                UPDATE dbo.RequestPass 
                SET CheckInTime = '${currentTime}', Status = 'CHECKIN', 
                    UpdatedBy = '${UserId}', UpdatedOn = dbo.GetISTTime() 
                WHERE RequestId = '${record.RequestId}';
            `;
            subject = `Check-in Successfully at CWI!`;
            text = `Dear Visitor,
                
                We're glad to confirm that you've checked-in successfully.
                
                During your visit, if you require any assistance or have questions, please don't hesitate to reach out to us. We're here to ensure your visit is comfortable and productive.
                
                Thank you for visiting us, and we look forward to making your visit memorable!
                
                Best regards,
                CWI Admin`;
                
            html = `<p>Dear Visitor</p>
                <p>We're glad to confirm that you've check-in successfully.</p>
                <p>During your visit, if you require any assistance or have questions, please don't hesitate to reach out to us. We're here to ensure your visit is comfortable and productive.</p>
                <p>Thank you for visiting us, and we look forward to making your visit memorable!</p>
                <p>Best regards,<br>CWI Admin</p>`;
            empSubject = `Visitor Checked-in at CWI!`;
            empText = `Your Visitor ${record.VisitorName} has checked in. Please be ready for the meeting and have the agenda prepared.`;
            empHtml = `<p>Your Visitor ${record.VisitorName} has checked in. Please be ready for the meeting and have the agenda prepared.</p>`;
            responseMessage = 'Check-in time updated and email sent successfully';
        } else if (!record.CheckOutTime) {
            updateQuery = `
                UPDATE dbo.RequestPass 
                SET CheckOutTime = '${currentTime}', Status = 'PENDINGMOM', 
                    UpdatedBy = '${UserId}', UpdatedOn = dbo.GetISTTime() 
                WHERE RequestId = '${record.RequestId}';
            `;
            subject = `Thank you for visiting CWI!`;
            text = `Dear Visitor,

                We hope you enjoyed your visit to CWI on ${record.MeetingDate}.

                If you have any questions or need further information, please don't hesitate to contact us. We'd be more than happy to assist you.

                Thank you again for visiting, and we look forward to welcoming you back soon!

                Best regards,
                CWI Admin`;

                html = `<p>Dear ${record.VisitorName},</p>
                <p>We hope you enjoyed your visit to CWI on <b>${record.MeetingDate}</b>.</p>
                <p>If you have any questions or need further information, please don't hesitate to contact us. We'd be more than happy to assist you.</p>
                <p>Thank you again for visiting, and we look forward to welcoming you back soon!</p>
                <p>Best regards,<br>CWI Admin</p>`;
            responseMessage = 'Check-out time updated and email sent successfully';
            } else {
            return res.status(400).json({ error: 'QR Code expired' });
        }

        await dbUtility.executeQuery(updateQuery);
        try {
            await transporter.sendMail({ from: '"CWI" <info@cooperwindindia.in>', to: record.Email, subject, text, html });
            if (empSubject) {
                await transporter.sendMail({ from: '"CWI" <info@cooperwindindia.in>', to: record.EmpEmail, subject: empSubject, text: empText, html: empHtml });
            }
            return res.status(200).json({ message: responseMessage, Status: true });
            //return res.status(200).json({ message: 'CheckOutTime Updated and email sent successfully', Status: true });
            
        } catch (emailError) {
            return res.status(500).json({ message: 'Update successful, but email failed', Status: false, error: emailError.message });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});




//#region Dashboard

router.get('/VMSDashboard', async (req, res) => {
    try {
        const { OrgId } = req.query;
        
        const TodayActiveLaborCheckInsQuery= 
        `
        SELECT count(*) AS TodayActiveLaborCheckins FROM dbo.LaborQRPass 
         WHERE  OrgId = ${OrgId} AND Date = CAST(GETDATE() AS DATE) AND CheckIn IS NOT NULL AND CheckOut IS NULL;
        `;
        //console.log(TodayActiveLaborCheckInsQuery);
        const TodayActiveVisitorsCheckInsQuery = `
        SELECT COUNT(VD.RequestId) AS TodayActiveVisitorsCheckins  FROM dbo.VisitorsPass VP 
 INNER JOIN dbo.VisitorsDetails VD ON VD.RequestId = VP.RequestId
        WHERE VP.OrgId = ${OrgId} AND CAST(MeetingDate AS DATE) = CAST(GETDATE() AS DATE) 
        AND CheckInTime IS NOT NULL AND CheckOutTime IS NULL;`;
        //console.log(TodayActiveVisitorsCheckInsQuery);
         const TodayVisitorsCountsQuery = `
                 SELECT COUNT(VD.RequestId) AS  TodayVisitorsCountQUery   FROM dbo.VisitorsPass VP 
 INNER JOIN dbo.VisitorsDetails VD ON VD.RequestId = VP.RequestId
        WHERE VP.OrgId = ${OrgId} AND VP.Status = 'APPROVED' AND CAST(MeetingDate AS DATE) = CAST(GETDATE() AS DATE) 
       `;
        const ContractorCountQuery = `
        select COUNT(*) AS ContractorCount from dbo.Contractor where OrgId = ${OrgId} AND IsActive = 1
        `;
        const MonthWiseVisitorsCountQuery = `
        SELECT DATENAME(MONTH, MeetingDate) AS [MonthName],COUNT(VD.RequestId) AS [VisitorCount]
       FROM dbo.VisitorsPass VP 
 INNER JOIN dbo.VisitorsDetails VD ON VD.RequestId = VP.RequestId
        WHERE VP.OrgId = ${OrgId} AND YEAR(MeetingDate) = YEAR(GETDATE()) 
        GROUP BY DATENAME(MONTH, MeetingDate), MONTH(MeetingDate) 
        ORDER BY MONTH(MeetingDate); 
        `;
        const MonthWiseCLsCountQuery = `
        SELECT DATENAME(MONTH, [Date]) AS [MonthName],COUNT(Id) AS [CLsCount]
        FROM [dbo].[LaborQRPass] WHERE OrgId = ${OrgId} AND YEAR(Date) = YEAR(GETDATE()) 
        GROUP BY DATENAME(MONTH, Date), MONTH(Date) 
        ORDER BY MONTH(Date); 
        `;
        const TodayActiveVisitorsCheckOutsQuery = `
        SELECT COUNT(VD.RequestId) AS TodayActiveVisitorsCheckins  FROM dbo.VisitorsPass VP 
 INNER JOIN dbo.VisitorsDetails VD ON VD.RequestId = VP.RequestId
        WHERE VP.OrgId = ${OrgId} AND CAST(MeetingDate AS DATE) = CAST(GETDATE() AS DATE) 
        AND CheckInTime IS NOT NULL AND CheckOutTime IS NOT NULL;`;

       
       
        const [
          
            TodayActiveLaborCheckIns,
            TodayVisitorsCounts,
            TodayActiveVisitorsCheckIns,
            ContractorCount,
            MonthWiseVisitorsCount,
            MonthWiseCLsCount,
            TodayActiveVisitorsCheckOuts
        ] = await Promise.all([ 
            dbUtility.executeQuery(TodayActiveLaborCheckInsQuery),
            dbUtility.executeQuery(TodayVisitorsCountsQuery),
            dbUtility.executeQuery(TodayActiveVisitorsCheckInsQuery ),
            dbUtility.executeQuery(ContractorCountQuery),
            dbUtility.executeQuery(MonthWiseVisitorsCountQuery),
            dbUtility.executeQuery(MonthWiseCLsCountQuery),
            dbUtility.executeQuery(TodayActiveVisitorsCheckOutsQuery)
            
           
        ]);
        res.json({
            TodayActiveLaborCheckIns,
            TodayVisitorsCounts,
            TodayActiveVisitorsCheckIns,
            ContractorCount,
            MonthWiseVisitorsCount,
            MonthWiseCLsCount,
            TodayActiveVisitorsCheckOuts
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/getActiveCheckIns', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().LABORCHECKINS);
});
//#endregion Dashboard

module.exports = router;
