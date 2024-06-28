import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ModalSubmitInteraction } from 'discord.js';

export default class ModalInteractionHandler extends InteractionHandler {
	public constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(context, { ...options, interactionHandlerType: InteractionHandlerTypes.ModalSubmit });
	}

	public override async parse(interaction: ModalSubmitInteraction) {
		if (!interaction.customId) return this.none();
		const temp = this.container.tempchannelManager.getTempChannel(interaction.guildId!, interaction.user.id)?.channelId;

		if (!temp) {
			await interaction.reply({ content: `You have never created a channel before`, ephemeral: true });
			return this.none();
		}
		return this.some(temp);
	}

	public override async run(interaction: ModalSubmitInteraction, data: string) {
		switch (interaction.customId) {
			case 'changeNameModal':
				await this.submitChangeNameModal(interaction, data);
				break;
			case 'changeUserLimitModal':
				await this.submitChangeUserLimitModal(interaction, data);
				break;
			default:
				break;
		}
	}

	private async submitChangeNameModal(interaction: ModalSubmitInteraction, temp: string) {
		const newName = interaction.fields.getTextInputValue('input');
		let tempChannel;

		try {
			tempChannel = interaction.guild?.channels.cache.get(temp!) || (await interaction.guild?.channels.fetch(temp));
		} catch (error) {
			this.container.logger.error(error);
		}
		if (tempChannel) {
			await interaction.guild?.channels.edit(tempChannel.id, {
				name: newName
			});
		}
		await this.container.tempchannelManager.updateTempChannelName(interaction.guildId!, interaction.user.id, newName);
		await interaction.reply({ content: `Your channel's name has been updated to ${newName}`, ephemeral: true });
	}

	private async submitChangeUserLimitModal(interaction: ModalSubmitInteraction, temp: string) {
		const newLimit = Number(interaction.fields.getTextInputValue('input'));

		if (!newLimit && newLimit !== 0) await interaction.reply({ content: 'Provide a number from 0 to 99', ephemeral: true });
		let tempChannel;
		try {
			tempChannel = interaction.guild?.channels.cache.get(temp!) || (await interaction.guild?.channels.fetch(temp));
		} catch (error) {
			this.container.logger.error(error);
		}
		if (tempChannel) {
			await interaction.guild?.channels.edit(tempChannel.id, {
				userLimit: newLimit
			});
		}
		await this.container.tempchannelManager.updateTempChannelLimit(interaction.guildId!, interaction.user.id, newLimit);
		await interaction.reply({ content: `Your channel's user limit has been updated to ${newLimit}`, ephemeral: true });
	}
}
