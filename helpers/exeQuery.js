const dbUtility = require('../dbUtility');


class exeQuery {

    GetMenu(JsonData, callback) {
        /*const sqlQuery = `
            SELECT *
        FROM V_RoleMenu
        WHERE RoleId = ${JsonData.RoleId} AND (OrgId = ${JsonData.OrgId} OR OrgId = 9333);
        `;*/
        const sqlQuery = `SELECT * FROM V_RoleMenu WHERE RoleId = ${JsonData.RoleId} AND OrgId = ${JsonData.OrgId} AND IsActive = 1 
        AND EXISTS (SELECT 1 FROM RoleMenu WHERE OrgId =  ${JsonData.OrgId} AND RoleId = ${JsonData.RoleId})
        UNION ALL
        SELECT * FROM V_RoleMenu WHERE RoleId = ${JsonData.RoleId}  AND OrgId = 9333 AND IsActive = 1
        AND NOT EXISTS (SELECT 1 FROM RoleMenu WHERE OrgId =  ${JsonData.OrgId} AND RoleId = ${JsonData.RoleId}) ORDER BY SortOrder;`;
        console.log(sqlQuery);
        dbUtility.executeQuery(sqlQuery)
            .then(results => callback(null, results))
            .catch(callback);
    }



    GetCancelNotify(JsonData, callback) {
        /*const sqlQuery = `
            SELECT *
        FROM V_RoleMenu
        WHERE RoleId = ${JsonData.RoleId} AND (OrgId = ${JsonData.OrgId} OR OrgId = 9333);
        `;*/
        const sqlQuery = `SELECT 
    o.EmailId AS FromMail, 
    v.Email AS ToEmail, 
    nc.Subject AS Subject, 
    nc.Text AS Text, 
    nc.Html AS Html 
FROM dbo.Organizations o
JOIN dbo.VisitorsDetails v ON v.RequestId = ${JsonData.RequestId} 
JOIN dbo.NotifyConfig nc ON 1 = 1  -- No direct relation, using cross join  
WHERE o.OrgId = ${JsonData.OrgId} AND NotifyName = 'MeetCanceled'`;
        console.log(sqlQuery);
        dbUtility.executeQuery(sqlQuery)
            .then(results => callback(null, results))
            .catch(callback);
    }
    
    GetMenuNodes(results,callback){
        if (!results || results.length === 0) {
            return callback(new Error('no Results'));
        }
        const menuNodes = this.buildMenuHierarchy(results);
        // Output the menu Nodes as JSON
        callback(null, menuNodes);
    }
    
    // Function to build menu hierarchy supporting multiple sublevels
    buildMenuHierarchy(menuItems) {
        // Step 1: Lookup object for all menu items by their AppMenuId
        const menuLookup = {};
        menuItems.forEach(menu => {
        menuLookup[menu.AppMenuId] = { 
            AppMenuId: menu.AppMenuId, 
            ReportId: menu.ReportId,
            MenuName: menu.MenuName,
            MenuPath: menu.MenuPath,
            IconName: menu.IconName,
            SubItems: [] };
        });
    
        // Step 2: Organize the items into the correct hierarchy
        const rootMenus = [];
    
        menuItems.forEach(menu => {
        if (menu.ParentId === 0) {
            // It's a root menu
            rootMenus.push(menuLookup[menu.AppMenuId]);
        } else {
            // It's a child, so add it to its parent's SubItems array
            if (menuLookup[menu.ParentId]) {
            menuLookup[menu.ParentId].SubItems.push(menuLookup[menu.AppMenuId]);
            }
        }
        });
        return rootMenus; // Return the structured menu hierarchy
    }

    SpSetRoleSecurity(TotJson, callback) {
        if (!TotJson) {
            return callback(new Error('RoleSecurity is undefined'));
        }
        const { orgid, RoleId, MenuId, IsChecked, CanWrite, CanDelete, CanExport, IsActive, UpdatedBy } = TotJson;
        console.log(TotJson);

        const sqlQuery = `
            EXEC [dbo].[SP_SetRoleSecurity]
            @orgid = '${orgid}',
            @RoleId = '${RoleId}',
            @MenuId = '${MenuId}',
            @IsChecked = '${IsChecked}',
            @CanWrite = '${CanWrite}',
            @CanDelete = '${CanDelete}',
            @CanExport = '${CanExport}',
            @IsActive =  '${IsActive}',
            @UpdatedBy = '${UpdatedBy}'
        `;

        console.log('sqlQuery:', sqlQuery);

        dbUtility.executeQuery(sqlQuery)
            .then(results => callback(null, results))
            .catch(callback);
    }
    //#region ManageRequestPass
    SpManageRequestPass(TotJson, callback) {
        if (!TotJson) {
            return callback(new Error('TotJson is undefined'));
        }
    
        const { orgid, userid, Operation, RequestPass, Attendees } = TotJson;
        const RequestPassJSON = JSON.stringify(RequestPass);
        const AttendeesJSON = JSON.stringify(Attendees);
    
        const sqlQuery = `
            EXEC [dbo].[SP_ManageRequestPass]
                @orgid = '${orgid}',
                @userid = '${userid}',
                @Operation = '${Operation}',
                @RequestPass = N'${RequestPassJSON.replace(/'/g, "''")}',
                @Attendees = N'${AttendeesJSON.replace(/'/g, "''")}'
        `;
        console.log(sqlQuery);
        dbUtility.executeQuery(sqlQuery)
            .then(results => callback(null, results))
            .catch(callback);
    }
    //#endregion ManageRequestPass

    //#region AadharChecKIns
    SpManageAadharChecKIns(TotJson, callback) {
        if (!TotJson) {
            return callback(new Error('TotJson is undefined'));
        }
        const { orgid, userid, ContractorId, AadharNo  } = TotJson;
        const sqlQuery = `
             EXEC [dbo].[SP_AadharCheckIns]
                @ContractorId = '${ContractorId}',
                @AadharNo = '${AadharNo}',
                @OrgId = '${orgid}',
                @CreatedBy = '${userid}';
        `;
        console.log(sqlQuery);
        dbUtility.executeQuery(sqlQuery)
            .then(results => callback(null, results))
            .catch(callback);
    }
    //#endregion AadharChecKIns

     //#region ManageVisitorsPass
     SpManageVisitorsPass(TotJson, callback) {
        if (!TotJson) {
            return callback(new Error('TotJson is undefined'));
        }
    
        const { orgid, userid, Operation, RequestPass, Attendees } = TotJson;
        const RequestPassJSON = JSON.stringify(RequestPass);
        const AttendeesJSON = JSON.stringify(Attendees);
    
        const sqlQuery = `
            EXEC [dbo].[SP_ManageVisitorsPass]
                @orgid = '${orgid}',
                @userid = '${userid}',
                @Operation = '${Operation}',
                @RequestPass = N'${RequestPassJSON.replace(/'/g, "''")}',
                @Visitors = N'${AttendeesJSON.replace(/'/g, "''")}'
        `;
        console.log(sqlQuery);
        dbUtility.executeQuery(sqlQuery)
            .then(results => callback(null, results))
            .catch(callback);
    }
    //#endregion ManageVisitorsPass

    
     //#region ManageCasualLabours
    SpManageCasualLabours(TotJson, callback) {
        if (!TotJson) {
            return callback(new Error('TotJson is undefined'));
        }
    
        const { orgid, userid, CasualLabourData } = TotJson;
        const CasualLabourDataJSON = JSON.stringify(CasualLabourData);
    
        const sqlQuery = `
            EXEC [dbo].[SP_ManageCasualLabours]
                @orgid = '${orgid}',
                @userid = '${userid}',
                @CasualLabourData = N'${CasualLabourDataJSON.replace(/'/g, "''")}'
        `;
        console.log(sqlQuery);
        dbUtility.executeQuery(sqlQuery)
            .then(results => callback(null, results))
            .catch(callback);
    }
    //#endregion ManageCasualLabours

    //#region SpGetNotificationDetails
    SpGetNotificationDetails(TotJson, callback) {
        if (!TotJson) {
            return callback(new Error('TotJson is undefined'));
        }
    
        const { RequestId, OrgId, UserId } = TotJson;
    
        const sqlQuery = `
            EXEC [dbo].[SP_GetNotificationDetails]
                @RequestId = '${RequestId}',
                @OrgId = '${OrgId}',
                @UserId = '${UserId}'
        `;
    
        console.log(sqlQuery); // Debugging purpose
        dbUtility.executeQuery(sqlQuery)
            .then(results => callback(null, results))
            .catch(callback);
    }
     
    //#endregion SpGetNotificationDetails

    //Forgot Password
    ForgotPassword(TotJson, callback) {
        if (!TotJson) {
            return callback(new Error('TotJson is undefined'));
        }
    
        const { Email } = TotJson;
    
        const sqlQuery = `
            EXEC [dbo].[SP_ForgotPassword]
                @Email = '${Email}'
        `;
    
        console.log(sqlQuery); // Debugging purpose
    
        dbUtility.executeQuery(sqlQuery)
            .then(results => callback(null, results))
            .catch(callback);
    }
    
    //Forgot Password
    
      //#region RandomCLS
    GetRandomCLS(TotJson, callback) {
        if (!TotJson) {
            return callback(new Error('TotJson is undefined'));
        }
    
        const { UserId } = TotJson;
    
        const sqlQuery = `
            EXEC dbo.SP_GetRandomCLS
                @UserId = '${UserId}'
        `;
    
        console.log(sqlQuery); // Debugging purpose
    
        dbUtility.executeQuery(sqlQuery)
            .then(results => callback(null, results))
            .catch(callback);
    }
    
    //#end region RandomCLS




    //#region VisitorCheckInOut
    SpHandleVisitorCheckInOut(TotJson, callback) { 
        if (!TotJson) {
            return callback(new Error('TotJson is undefined'));
        }
    
        const { OrgId, VisitorId, UserId } = TotJson;
    
        const sqlQuery = `
            EXEC [dbo].[SP_HandleVisitorCheckInOut]
                @OrgId = '${OrgId}',
                @VisitorId = '${VisitorId}',
                @UserId = '${UserId}'
        `;
    
        console.log(sqlQuery); // Log query for debugging
    
        dbUtility.executeQuery(sqlQuery)
            .then(results => callback(null, results))
            .catch(callback);
    }
    //end region VisitorCheckInOut

    //#region ManageLaborQRPass
    SpManageLaborQRPass(TotJson, callback) {
        if (!TotJson) {
            return callback(new Error('TotJson is undefined'));
        }

        const { orgid, userid, Time, Date, QRCode, ContractorId } = TotJson;
        
        // Validate required fields
        if (!Time || !Date || !QRCode || !ContractorId) {
            return callback(new Error('Missing required fields: Time, Date, QRCode, ContractorId'));
        }

        const sqlQuery = `
            EXEC [dbo].[ManageLaborQRPass]
                @Time = '${Time}',
                @UserId = '${userid}',
                @Date = '${Date}',
                @QRCode = '${QRCode.replace(/'/g, "''")}',
                @ContractorId = '${ContractorId}',
                @OrgId = '${orgid}'
        `;
        
        console.log(sqlQuery);
        dbUtility.executeQuery(sqlQuery)
            .then(results => callback(null, results))
            .catch(callback);
    }
    //#endregion ManageLaborQRPass

    
    

    //#region ScreenOperations
    Execute_SP(data, OperationId, callback) {
        //console.log(data);
        const sqlQuery = `
        DECLARE @ResultMessage NVARCHAR(MAX);
        DECLARE @STATUS NVARCHAR(MAX); -- Corrected declaration
        EXEC [dbo].[SP_ScreenOperations]
            @OperationId = '${OperationId}',
            @JsonData = '${data}',
            @ResultMessage = @ResultMessage OUTPUT,
            @STATUS = @STATUS OUTPUT; -- Passing @STATUS as an output parameter
        SELECT @ResultMessage AS ResultMessage, @STATUS AS Status; -- Retrieving both output parameters
        `;
        console.log(sqlQuery);
        dbUtility.executeQuery(sqlQuery)
            .then(results => callback(null, results))
            .catch(callback);
    }
    //#region ScreenOperations

    Exec_SpReport(rptJson, callback) {
        if (!rptJson) {
            return callback(new Error('Report Params is undefined'));
        }
        const { OrgId, UserId, ReportId, ReportCriteria } = rptJson;
        console.log(rptJson);
        const ReportJSON = JSON.stringify(ReportCriteria);
        console.log(ReportJSON);
        const sqlQuery = `
            EXEC [dbo].[Sp_GenerateReport]
            @OrgId = '${OrgId}',
            @Userid = '${UserId}',
            @ReportId = '${ReportId}',
            @ReportCritieria = N'${ReportJSON.replace(/'/g, "''")}'
        `;

        console.log('sqlQuery:', sqlQuery);

        dbUtility.executeForMultipleDS(sqlQuery)
            .then(results => callback(null, results))
            .catch(callback);
    }
   


}

module.exports = new exeQuery();
