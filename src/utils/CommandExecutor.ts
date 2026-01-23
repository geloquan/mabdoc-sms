import { CommandResponse, QueueEntry } from '../types';
import { Platform } from 'react-native';
import QueueStorageService from '../services/QueueStorageService';

class CommandExecutor {
  async executeCommand(commandResponse: CommandResponse): Promise<void> {
    const { command, parameters } = commandResponse;

    console.log('Executing command:', command, parameters);

    switch (command.toLowerCase()) {
      case 'restart':
      case 'reboot':
        await this.restartDevice();
        break;
      case 'shutdown':
        console.log('Shutdown command received but not implemented');
        break;
      default:
        console.log('Unknown command:', command);
    }
  }

  async executeQueueEntry(entry: QueueEntry): Promise<void> {
    try {
      // Mark as processing
      await QueueStorageService.updateEntryStatus(entry.id, 'processing');

      // Execute the command
      const commandResponse: CommandResponse = {
        command: entry.command,
        parameters: entry.parameters,
      };

      await this.executeCommand(commandResponse);

      // Mark as completed
      await QueueStorageService.updateEntryStatus(
        entry.id,
        'completed',
        { executedAt: Date.now() }
      );
    } catch (error) {
      console.error('Error executing queue entry:', error);
      // Mark as failed
      await QueueStorageService.updateEntryStatus(
        entry.id,
        'failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private async restartDevice(): Promise<void> {
    // Note: Restarting requires special permissions and may not work on all devices
    if (Platform.OS === 'android') {
      try {
        // This would require a native module or root access
        console.log('Restart device command - requires native implementation');
        // You would need to create a native module to actually restart the device
        // For now, we'll just log it
      } catch (error) {
        console.error('Error restarting device:', error);
      }
    }
  }
}

export default new CommandExecutor();

