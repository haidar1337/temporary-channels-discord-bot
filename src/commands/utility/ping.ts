import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Message } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'ping pong',
	requiredUserPermissions: ['AddReactions'],
	cooldownDelay: 3000,
	preconditions: ['GuildOnly']
})
export class UserCommand extends Command {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: Command.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});

		// Register Context Menu command available from any message
		// registry.registerContextMenuCommand({
		// 	name: this.name,
		// 	type: ApplicationCommandType.Message
		// });

		// Register Context Menu command available from any user
		// registry.registerContextMenuCommand({
		// 	name: this.name,
		// 	type: ApplicationCommandType.User
		// });
	}

	// Message command
	// public override async messageRun(message: Message) {
	// 	return this.sendPing(message);
	// }

	// Chat Input (slash) command
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.sendPing(interaction);
	}

	// Context Menu command
	// public override async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
	// 	return this.sendPing(interaction);
	// }

	private async sendPing(interaction: Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction) {
		const pingMessage = await interaction.reply({ content: 'Ping?', fetchReply: true });

		const content = `Pong! Bot Latency ${Math.round(this.container.client.ws.ping)}ms. API Latency ${
			pingMessage.createdTimestamp - interaction.createdTimestamp
		}ms.`;

		if (interaction instanceof Message) {
			return pingMessage.edit({ content });
		}

		return interaction.editReply({
			content
		});
	}
}
