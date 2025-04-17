const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const router = express.Router();
const { handleRecord } = require('../helpers/RecordHandler.js');
const { OperationEnums } = require('../helpers/utilityEnum.js');
const Notify = require('../helpers/notifications.js');
const exeQuery = require('../helpers/exeQuery');
const dbUtility = require('../dbUtility');
const { Console } = require('winston/lib/winston/transports/index.js');

const upload = multer({ dest: 'uploads/' }); 
router.use(express.json());


// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "info@cooperwindindia.in", //"pavansai.nittu@gmail.com",
        pass: "fgja gqyd jjdk ivmr"//"hgxv kbnt vuxp uwaz", // Your App Password
        //user: 'info@cooperwindindia.in', 
        //pass: 'hgxv kbnt vuxp uwaz'       // Your App Password
    }
});

//#region Departments
router.get('/getDepts', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().GETDEPT);
});
//#end region Departments



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



//#region ManageVisitorsPass
router.post('/ManageVisitorsPass', async (req, res) => {
    try {
        // Validate request body
        if (!req.body || !req.body.orgid || !req.body.userid || !req.body.Operation || !req.body.RequestPass || !req.body.Attendees) {
            return res.status(400).send({ error: 'Missing required parameters' });
        }

        exeQuery.SpManageVisitorsPass(req.body, (error, results) => {
            if (error) {
                return res.status(400).send({ error: error.message });
            }

            // Send response first
            res.status(200).send(results);

            // After response, send email notification asynchronously
            console.log(results[0].Success);
            if (results[0].Success === 1) {
                console.log('hi');
                Notify.MailToManager(results);
            }
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
    //     SELECT RequestId,  RequestDate, CAST(MeetingDate AS DATE) AS MeetingDate,MeetingTime,
    //     VisitorType, Status, AutoIncNo,  Remarks 
    //    FROM dbo.VisitorsPass 
        let query = `
           SELECT 
    VP.RequestId,  
    VP.RequestDate, 
    CAST(VP.MeetingDate AS DATE) AS MeetingDate,
    VP.MeetingTime,
    VP.VisitorType, 
    VP.Status, 
    VP.AutoIncNo,  
    VP.Remarks, 
    US.Name AS EmployeeName, 
    MGR.Name AS ManagerName
FROM 
    dbo.VisitorsPass VP
INNER JOIN 
    dbo.Users US ON US.Id = VP.CreatedBy
LEFT JOIN 
    dbo.Users MGR ON MGR.Id = US.ManagerId 

            WHERE VP.OrgId = ${OrgId} 
            AND VP.IsActive = 1`;

        // Role-based filtering
        if (RoleId === 4) { // Security
            query += ` AND Status IN ('APPROVED','CHECKIN')  AND MeetingDate = CAST(GETDATE() AS DATE)`;
        } else if (RoleId === 2) { // HR
            query += ` AND Status IN ('REJECTED', 'DRAFT')`;
        } else if (RoleId === 3) { // Employee
            query += ` AND VP.CreatedBy = ${UserId}`;
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




router.get('/getReqPassById', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().GETREQPASSBYID);
});
router.get('/TodayVisits', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().TODAYVISITS);
});

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
                            //console.log(record[0].Email);
                            if (record.Email) {
                                const to = record.Email;
                                const Passno = record.AutoIncNo;
                                const subject = `MOM Submission`;
                                const text = `MOM submission`;
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

router.get('/PassApproval', async (req, res) => {
    try {
        // Extract query parameters
        const { RequestId, OrgId, UserId } = req.query;

        // Validate required parameters
        if (!RequestId || !OrgId || !UserId) {
            return res.status(400).send({ error: 'Missing required query parameters' });
        }

        // Call stored procedure with extracted parameters
        exeQuery.SpGetNotificationDetails({ RequestId, OrgId, UserId }, async (error, results) => {
            if (error) {
                return res.status(500).send({ error: error.message });
            }

            // Send response first
            //res.status(200).send(results);
           res.status(200).json({ message: 'Status Approved', Status: true });
           console.log('Notification Details:', results);

            // Send emails to visitors
            try {
                if (results.length > 0) {
                    await Promise.all(results.map((result) => Notify.MailToVisitors(result)));
                    console.log('Emails sent successfully');
                }
            } catch (mailError) {
                console.error('Error sending emails:', mailError);
            }
        });

    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});


//region MailApprove&reject
router.get('/MailPassApproval', async (req, res) => {
    try {
        const { RequestId, OrgId, UserId } = req.query;

        if (!RequestId || !OrgId || !UserId) {
            return res.status(204).end(); // No Content
        }

        exeQuery.SpGetNotificationDetails({ RequestId, OrgId, UserId }, async (error, results) => {
            if (error) {
                console.error('DB Error:', error.message);
                return res.status(204).end(); // No Content
            }

            try {
                if (results.length > 0) {
                    await Promise.all(results.map((result) => Notify.MailToVisitors(result)));
                    console.log('Emails sent successfully');
                }
            } catch (mailError) {
                console.error('Mail Error:', mailError);
            }
            console.log('HAI');
            //return res.status(204).end(); // ✅ End response silently
            return res.send(`
                <html>
                  <body style="font-family: Arial; padding: 20px; text-align: center;">
                    <h2>Pass Approved Successful</h2>
                    <p>Kindly you can close this tab.</p>
                  </body>
                </html>
              `);
              
        });

    } catch (error) {
        console.error('Unexpected Error:', error.message);
        return res.status(204).end(); // Still respond silently
    }
});

router.get('/MailRejectPass', async (req, res) => {
    try {
        const { RequestId, OrgId, UpdatedBy } = req.query;

        if (!RequestId || !UpdatedBy) {
            return res.send(`
              <html>
                <body style="font-family: Arial; padding: 20px;">
                  <h2>Invalid Request</h2>
                  <p>Missing required parameters.</p>
                </body>
              </html>
            `);
        }

        const updateQuery = `
            UPDATE dbo.VisitorsPass 
            SET Status = 'REJECTED', 
                UpdatedBy = '${UpdatedBy}', 
                UpdatedOn = dbo.GetISTTime() 
            WHERE RequestId = '${RequestId}';
        `;

        await dbUtility.executeQuery(updateQuery);

        // ✅ Response page after rejection
        return res.send(`
          <html>
            <body style="font-family: Arial; padding: 20px; text-align: center;">
              <h2>Pass Rejected Successful</h2>
              <p>Kindly close this tab.</p>
            </body>
          </html>
        `);

    } catch (error) {
        console.error('RejectPass Error:', error.message);
        return res.send(`
          <html>
            <body style="font-family: Arial; padding: 20px;">
              <h2>Error</h2>
              <p>Something went wrong while rejecting the pass.</p>
            </body>
          </html>
        `);
    }
});
//#endregion MailApprove&reject

router.get('/RejectPass', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().REJECT);
});



//#endregion PassApproval&email




//#region QRCheckInCheckOut
router.post('/QRCheckInCheckOut', async (req, res) => {
    try {
        

        exeQuery.SpHandleVisitorCheckInOut(req.body, (error, results) => {
            if (error) {
                return res.status(400).send({ error: error.message });
            }

            // Send response first
            res.status(200).send(results);
           
            //res.status(200).json({ message: 'CheckIn/CheckOut Updated', Status: true });
            console.log(results);
            console.log('HI');
            
            if (results[0].FromEmail) {
                console.log('hi');
                Notify.MailCheckInOut(results);
            }
            // After response, send email notification asynchronously
            // console.log(results[0].Success);
            // if (results[0].Success === 1) {
            //     console.log('hi');
            //     MailToManager(results);
            // }
        });

    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.post('/CancelVisit', async (req, res) => {
    const {UpdatedBy, RequestId} = req.body; 
    const data = req.body;
    const updateMOMQuery = `
    UPDATE dbo.VisitorsPass 
    SET 
        Status = 'CANCELED', 
        UpdatedBy = '${UpdatedBy}', 
        UpdatedOn = dbo.GetISTTime()
    WHERE RequestId = '${RequestId}';
`;
   const rowsAffected = await dbUtility.executeQueryrowsAffected(updateMOMQuery);
   if (rowsAffected > 0) {
    
    exeQuery.GetCancelNotify(data, (error, results) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            //console.log(results);
            //res.status(200).send(results);
            res.status(200).json({ message: 'Status Updated', Status: true });
            if (results && results.length > 0) {
                Notify.CancelMailToVisitors(results);
            }

          
        });
   }
});

router.get('/getManagers', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().GETMANAGER);
});

router.post('/ForgotPassword', async (req, res) => {
    const data = req.body;
    exeQuery.ForgotPassword(data, (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        if (results && results.length > 0) {
            Notify.OTPmail(results);
        }
        res.status(200).json({ message: 'OTP Sent SuccessFul', Status: true });
    });

});


router.post('/ConfirmOTP', async (req, res) => {
    const { Email, OTP } = req.body;

    if (!Email || !OTP) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    try {
        // Parameterized query to prevent SQL Injection
        const getQuery = `
            SELECT * FROM dbo.Users 
            WHERE Email = '${Email}' AND LastOtpLogin = '${OTP}'
        `;

        const results = await dbUtility.executeQuery(getQuery);

        if (results.length > 0) {
            return res.status(200).json({ message: 'OTP Matched' });
        } else {
            return res.status(400).json({ error: 'Invalid OTP' });
        }
    } catch (error) {
        console.error('Error confirming OTP:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});






router.get('/ActiveVisitorCheckIns', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().VISITACTCHKINS);
});


router.get('/ActiveVisitorCheckOuts', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().VISITACTCHKOUTS);
});

module.exports = router;
