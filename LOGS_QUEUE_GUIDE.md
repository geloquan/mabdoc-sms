# Logs and Queue Features - Quick Reference

## Overview
This document provides a quick reference for the new encrypted logs and queue management features added to the SMS Sender application.

## Key Features

### 1. Encrypted Storage
- **Device-Specific Keys**: Encryption keys are generated from device-specific information (device ID, model, app version)
- **AES Encryption**: Industry-standard AES encryption makes data unreadable by unauthorized parties
- **Local Storage**: All logs and queue data are stored locally on the device
- **Secure Export**: Exported data remains encrypted and can only be decrypted on the same device

### 2. API Logs

#### What is Logged
Every API call made by the application is automatically logged with:
- **Endpoint**: The full URL of the API endpoint
- **Method**: HTTP method (GET or POST)
- **Type**: SMS, Health, or Command
- **Request Data**: The data sent to the API
- **Response Data**: The data received from the API
- **Success/Failure**: Whether the call was successful
- **Error Messages**: Detailed error information if the call failed
- **Duration**: How long the API call took (in milliseconds)
- **Timestamp**: When the call was made

#### Accessing Logs
1. Open the app
2. Tap "Logs" button on the Dashboard
3. View all logs in chronological order (newest first)

#### Searching Logs
- Use the search bar to find logs by keyword
- Search works across endpoint, error messages, and response data

#### Filtering Logs
- Filter by **Type**: SMS, Health, or Command
- Filter by **Status**: Success or Failed
- Combine filters for precise results

#### Managing Logs
- **Export**: Share encrypted logs for backup or analysis
- **Import**: Restore previously exported logs
- **Clear**: Remove all logs (cannot be undone)

#### Storage Limits
- Maximum 1,000 log entries
- Oldest logs are automatically removed when limit is reached

### 3. Command Queue

#### What is the Queue
All commands received from the API are added to a queue before execution. This provides:
- **Visibility**: See all commands that have been received
- **Status Tracking**: Know which commands are pending, executing, completed, or failed
- **History**: Keep a record of all executed commands
- **Error Tracking**: See why commands failed

#### Queue Item Information
Each queue item contains:
- **Command Name**: The command to execute
- **Parameters**: Additional data for the command
- **Status**: Pending, Executing, Completed, or Failed
- **Timestamps**: When queued and when executed
- **Error Messages**: Why a command failed
- **Retry Count**: How many times execution was attempted

#### Queue Status
- **Pending**: Command is waiting to be executed
- **Executing**: Command is currently running
- **Completed**: Command executed successfully
- **Failed**: Command execution failed

#### Accessing Queue
1. Open the app
2. Tap "Queue" button on the Dashboard
3. View all queue items

#### Searching Queue
- Use the search bar to find queue items by command name or parameters

#### Filtering Queue
- Filter by **Status**: Pending, Executing, Completed, or Failed

#### Managing Queue
- **Export**: Share encrypted queue for backup
- **Import**: Restore previously exported queue
- **Clear Done**: Remove only completed commands
- **Clear All**: Remove all queue items
- **Remove**: Delete individual queue items

#### Storage Limits
- Maximum 500 queue items
- Manual cleanup required when limit is reached

## Import/Export Format

### Logs Export Format
```json
{
  "logs": "<encrypted-data>",
  "encrypted": true,
  "timestamp": 1234567890
}
```

### Queue Export Format
```json
{
  "queue": "<encrypted-data>",
  "encrypted": true,
  "timestamp": 1234567890
}
```

### Important Notes
- Exported data is in JSON format but the actual logs/queue data is encrypted
- Data can only be decrypted on the same device where it was encrypted
- Do not modify the exported JSON manually - it will fail to import

## Security Considerations

### Data Protection
1. **Encryption at Rest**: All stored data is encrypted using AES
2. **Device Binding**: Encryption keys are device-specific
3. **No Plain Text**: Logs and queue are never stored in plain text
4. **Secure Export**: Exported files remain encrypted

### What This Means
- Even if someone accesses the app's storage, they cannot read the logs or queue
- Exported files cannot be read without the original device
- Data is protected against unauthorized access

### Limitations
- If the device is factory reset, the encryption key changes and old data becomes unreadable
- Data cannot be transferred between devices (by design)
- Encryption provides security but not complete anonymity

## Use Cases

### Debugging API Issues
1. Navigate to Logs screen
2. Filter by "Failed" status
3. Review error messages and response data
4. Export logs to share with API team

### Monitoring Command Execution
1. Navigate to Queue screen
2. Check status of recent commands
3. Review failed commands to understand issues
4. Clear completed commands to keep queue clean

### Backup and Restore
1. Export logs and queue regularly
2. Store exports in a secure location
3. Import after app reinstall or data loss
4. Note: Imports only work on the same device

### Analyzing API Performance
1. Navigate to Logs screen
2. Review duration metadata
3. Identify slow API calls
4. Export for detailed analysis

## Troubleshooting

### "Failed to decrypt" Error
- This happens when trying to import data encrypted on a different device
- Solution: Only import data on the same device where it was exported

### Logs Not Appearing
- Logs only appear after API calls are made
- Check that background tasks are running
- Verify API settings are correct

### Queue Items Stuck in "Executing"
- This may happen if the app crashes during command execution
- Solution: Remove the stuck item manually

### Storage Full Warning
- Logs: Limited to 1,000 entries (auto-cleanup)
- Queue: Limited to 500 items (manual cleanup required)
- Solution: Clear old completed items or export and clear all

## Best Practices

1. **Regular Exports**: Export logs and queue weekly for backup
2. **Clean Queue**: Remove completed items regularly to avoid hitting storage limits
3. **Monitor Failures**: Check failed logs and queue items to catch issues early
4. **Secure Storage**: Store exported files in a secure location
5. **Test Imports**: Verify imports work before clearing original data

---

For more information, see the main DOCUMENTATION.md file.
