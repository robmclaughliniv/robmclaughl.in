"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const crypto_1 = require("crypto");
// Ensure the table name is provided via environment variables
const tableName = process.env.DYNAMODB_TABLE_NAME;
if (!tableName) {
    throw new Error("Environment variable DYNAMODB_TABLE_NAME is not set.");
}
// Initialize DynamoDB Document Client
const client = new client_dynamodb_1.DynamoDBClient({});
const ddbDocClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const handler = async (event, context) => {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);
    try {
        const itemId = (0, crypto_1.randomUUID)();
        const timestamp = new Date().toISOString();
        // Example data to write
        const itemData = {
            id: itemId, // Assuming 'id' is your partition key
            message: "Hello from Lambda!",
            receivedEvent: event.body || "No body", // Example: store request body
            createdAt: timestamp,
        };
        const putCommand = new lib_dynamodb_1.PutCommand({
            TableName: tableName,
            Item: itemData,
        });
        console.log(`Writing item to DynamoDB table ${tableName}:`, itemData);
        await ddbDocClient.send(putCommand);
        console.log("Successfully wrote item to DynamoDB.");
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Successfully wrote item to DynamoDB!',
                itemId: itemId,
            }),
            headers: {
                "Content-Type": "application/json"
            }
        };
    }
    catch (error) {
        console.error("Error writing to DynamoDB:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to write item to DynamoDB.',
                error: errorMessage,
            }),
            headers: {
                "Content-Type": "application/json"
            }
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=index.js.map