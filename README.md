
/api-docs/




  /*
"get": {
    "tags": ["Request Pass"],
    "summary": "Make an Attendee Inactive",
    "description": "Marks an attendee as inactive in the system based on their ID.",
    "parameters": [
      {
        "name": "AttendeId",
        "in": "query",
        "required": true,
        "schema": {
          "type": "integer",
          "example": 1
        },
        "description": "The ID of the attendee to make inactive."
      },
      {
        "name": "UserId",
        "in": "query",
        "required": true,
        "schema": {
          "type": "integer",
          "example": 1
        },
        "description": "The ID of the user performing the operation."
      }
    ],
    "responses": {
      "200": {
        "description": "The operation was successful, and the attendee is now inactive.",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "success": {
                  "type": "boolean",
                  "example": true
                },
                "message": {
                  "type": "string",
                  "example": "Attendee has been made inactive successfully."
                }
              }
            }
          }
        }
      }*/4
PM2:

pm2 logs mybackend
pm2 list
pm2 startup
pm2 restart mybackend  # Restart the service
pm2 stop mybackend     # Stop the service
pm2 delete mybackend   # Remove from PM2


DB_USER=admin
DB_PASSWORD=vms123456
DB_SERVER=vms2025.czyay66ssdpk.eu-north-1.rds.amazonaws.com
DB_DATABASE=QAVMS1
DB_PORT=1433

DB_USER=sa
DB_PASSWORD=sadguru
DB_SERVER=DESKTOP-6J6FU6P/SQLEXPRESS
DB_DATABASE=QAVMS1
DB_PORT=1433
