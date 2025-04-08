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


router.get('/GetCheckInValidations', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().GETCHECKINVAL);
});

router.get('/GetValidDay', (req, res) => {
    const data = req.query; 
    handleRecord(req, res, data, OperationEnums().GETVALIDDAY);
});

router.post('/Updtcomments', async (req, res)=>{
    const data = req.body;
    handleRecord(req, res, data, OperationEnums().UPDTCMNTS);
});

router.post('/GetRandomCLS', async (req, res) => {
    const data = req.body;
    exeQuery.GetRandomCLS(data, (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.status(200).send(results);
        if (results && results.length > 0) {
           // Notify.OTPmail(results);
        }
        //res.status(200).json({ message: 'OTP Sent SuccessFul', Status: true });
    });

});

module.exports = router;
