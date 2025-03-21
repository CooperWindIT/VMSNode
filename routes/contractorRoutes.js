const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();
const { handleRecord } = require('../helpers/RecordHandler.js');
const { OperationEnums } = require('../helpers/utilityEnum.js');
const exeQuery = require('../helpers/exeQuery');
const dbUtility = require('../dbUtility');
const { Console } = require('winston/lib/winston/transports/index.js');


router.use(express.json());


// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'yaswanthpg9@gmail.com', 
        pass: 'bigmixvfocxidpme'       // Your App Password
    }
});



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

// Email Service
router.post('/send-email', async (req, res) => {
    const { to, subject, text, html } = req.body;
    
    // Email options
    const mailOptions = {
        from: '"Gireesh" <yaswanthpg9@gmail.com>', // Sender's name and email
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


//#region ManageLabourPass
router.post('/ManageCasualLabours', async (req, res) => {
    try {
        // Validate request body
        if (!req.body || !req.body.orgid || !req.body.userid  || !req.body.CasualLabourData) {
            return res.status(400).send({ error: 'Missing required parameters' });
        }

        exeQuery.SpManageCasualLabours(req.body, (error, results) => {
            if (error) {
                return res.status(400).send({ error: error.message });
            }

            // Send response first
            res.status(200).send(results);
        });

    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});


router.post('/POSTContractors', async (req, res)=>{
    const data = req.body;
    handleRecord(req, res, data, OperationEnums().CONTINSRT);
});

router.post('/UPDTContractors', async (req, res)=>{
    const data = req.body;
    handleRecord(req, res, data, OperationEnums().UPDTCONTRACT);
});

router.get('/getContractors', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().GETCONTRACT);
});

router.post('/POSTCasualLabors', async (req, res)=>{
    const data = req.body;
    handleRecord(req, res, data, OperationEnums().INSRTCLS);
});

router.post('/UPDTCasualLabors', async (req, res)=>{
    const data = req.body;
    handleRecord(req, res, data, OperationEnums().UPDTCLS);
});

router.post('/InactiveLabors', async (req, res)=>{
    const data = req.body;
    console.log(data);
    handleRecord(req, res, data, OperationEnums().DELTCLS);
});

router.get('/getContractorQrPasses', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().GETQRPASS);
});


router.get('/getShiftTimings', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().GETSHFTTIMES);
});


//#endregion ManageLaborQRPass


//#region LabourINOUT
router.post('/LaborCheckIn', async (req, res)=>{
    const data = req.body;
    handleRecord(req, res, data, OperationEnums().QRCHECKIN);
});
router.post('/LaborCheckOut', async (req, res)=>{
    const data = req.body;
    handleRecord(req, res, data, OperationEnums().QRCHECKOUT);
});
router.get('/getCasualLabours', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().GETCLS);
});

router.get('/getCLSById', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().GetCLSById);
});



//#end region LabourINOUT

router.get('/ActiveLAbourCheckIns', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().LBOURACTCHKINS);
});


module.exports = router;
