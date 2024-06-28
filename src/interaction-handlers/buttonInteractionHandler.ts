import { Status } from '@prisma/client';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
	ActionRowBuilder,
	ButtonInteraction,
	ModalActionRowComponentBuilder,
	ModalBuilder,
	OverwriteResolvable,
	TextInputBuilder,
	TextInputStyle
} from 'discord.js';

export default class ButtonInteractionHandler extends InteractionHandler {
	public constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(context, { ...options, interactionHandlerType: InteractionHandlerTypes.Button });
	}

	public override parse(interaction: ButtonInteraction) {
		if (!interaction.customId) return this.none();
		return this.some({ interaction });
	}

	public override async run(interaction: ButtonInteraction) {
		switch (interaction.customId) {
			case 'changeName':
				await this.showChangeNameModal(interaction);
				break;
			case 'changeUserLimit':
				await this.showChangeUserLimitModal(interaction);
				break;
			case 'toggleLock':
				await this.toggleLock(interaction);
				break;
			default:
				break;
		}
	}

	private async showChangeNameModal(interaction: ButtonInteraction) {
		const input = new TextInputBuilder()
			.setCustomId('input')
			.setLabel('Channel Name')
			.setPlaceholder("Rush's Channel")
			.setMinLength(1)
			.setMaxLength(40)
			.setStyle(TextInputStyle.Short);
		const row = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(input);
		const modal = new ModalBuilder().setCustomId('changeNameModal').setTitle('Update Channel Name').addComponents(row);
		await interaction.showModal(modal);
	}

	private async showChangeUserLimitModal(interaction: ButtonInteraction) {
		const input = new TextInputBuilder()
			.setCustomId('input')
			.setLabel('User Limit')
			.setPlaceholder('12')
			.setMinLength(1)
			.setMaxLength(2)
			.setStyle(TextInputStyle.Short);
		const row = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(input);
		const modal = new ModalBuilder().setCustomId('changeUserLimitModal').setTitle('Update User Limit').addComponents(row);
		await interaction.showModal(modal);
	}

	private async toggleLock(interaction: ButtonInteraction) {
		const temp = this.container.tempchannelManager.getTempChannel(interaction.guildId!, interaction.user.id);
		if (!temp) {
			await interaction.reply({ content: `You have never created a channel before`, ephemeral: true });
			return;
		}
		const perms: OverwriteResolvable[] = [
			{
				id: interaction.guild!.roles.everyone.id,
				deny: ['Connect']
			},
			{
				id: interaction.user.id,
				allow: ['Connect', 'Speak']
			}
		];
		let tempChannel;
		try {
			tempChannel = interaction.guild?.channels.cache.get(temp.channelId) || (await interaction.guild?.channels.fetch(temp.channelId));
		} catch (error) {
			this.container.logger.error(error);
		}
		const status = temp.status;

		if (tempChannel) {
			if (status === Status.CLOSE) {
				perms[0].allow = ['Connect', 'Speak'];
				perms[0].deny = [];
				await interaction.guild?.channels.edit(tempChannel.id, {
					permissionOverwrites: perms
				});
			} else {
				await interaction.guild?.channels.edit(tempChannel.id, {
					permissionOverwrites: perms
				});
			}
		}
		await this.container.tempchannelManager.toggleTempChannelLock(
			interaction.guildId!,
			interaction.user.id,
			status === Status.OPEN ? Status.CLOSE : Status.OPEN
		);
		await interaction.reply({ content: `Your channel has been ${status === Status.OPEN ? 'locked' : 'unlocked'}`, ephemeral: true });
	}
}
