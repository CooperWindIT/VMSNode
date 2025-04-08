function OperationEnums() {
    const Operations = {
        SIGNIN:1,
        GETREQPASS:2,
        GETREQPASSBYID:3,
        ADETAIL:4,
        CONTINSRT:5,
        GETCONTRACT:6,
        GETQRPASS:7,
        GETSHFTTIMES:8,
        UPDTCONTRACT:9,
        ADDUSER:10,
        UPDTUSER:11,
        MOMSUBMIT:12,
        GETUSERS:13,
        DELTUSER:14,
        PASSCHECKIN:15,
        PASSCHECKOUT:16,
        QRCHECKIN:17,
        QRCHECKOUT:18,
        GETROLES:19,
        RSECURSEL:20,
        GETREPORTHEAD:21,
        LABORCHECKINS: 22,
        FRGTPASWRD:23,
        GETDEPT:24,
        REJECT:25,
        GETMANAGER:26,
        INSRTCLS:27,
        UPDTCLS:28,
        GETCLS:29,
        GetCLSById:30,
        DELTROLMNU:31,
        DELTCLS:32,
        LBOURACTCHKINS:33,
        VISITACTCHKINS:34,
        GETCHECKINVAL:35,
        GETVALIDDAY:36,
        UPDTCMNTS:37
    };

    return Operations;
}

module.exports = {
    OperationEnums
};
