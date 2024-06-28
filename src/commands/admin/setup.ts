import { Command } from '@sapphire/framework';
import { ChannelType, MessageCreateOptions, PermissionFlagsBits } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Guild } from 'discord.js';
import { getErrorEmbed } from '../../lib/utils';
export class SetupCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName('setup')
				.setDescription('A command to setup the entry point of creating temp channels')
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.memberPermissions!.has(PermissionFlagsBits.Administrator)) return;
		const options = this.createPanelMessage(interaction.guild!);
		const panel = await this.createPanelChannel(interaction.guild!);
		const errorEmbed = getErrorEmbed('A panel already exists.');
		if (!panel) return interaction.reply({ embeds: [errorEmbed] });

		return interaction.reply({ embeds: options.embeds, components: options.components });
	}

	private createPanelMessage(guild: Guild): MessageCreateOptions {
		const embed = new EmbedBuilder()
			.setTitle('Manage Your Own Temp Channel Using This Panel!')
			.setDescription(
				"Use this panel to manage your own temp channel such as changing your channel's name, user limit, or locking and unlocking it. Start by creating your own channel to be able to manage it."
			)
			.setColor(0xa1142c)
			.setFooter({
				text: guild.name,
				iconURL: guild.iconURL()!
			})
			.addFields({
				name: 'Creating A Temp Channel',
				value: 'Join "Create Your Channel" channel and your channel will be automatically created.'
			});
		const toggleLockButton = new ButtonBuilder().setCustomId('toggleLock').setStyle(ButtonStyle.Secondary).setLabel('Toggle Lock').setEmoji('🔒');
		const changeNameButton = new ButtonBuilder()
			.setCustomId('changeName')
			.setStyle(ButtonStyle.Primary)
			.setLabel('Change Channel Name')
			.setEmoji('✍');
		const changeUserLimitButton = new ButtonBuilder()
			.setCustomId('changeUserLimit')
			.setStyle(ButtonStyle.Danger)
			.setLabel('Change User Limit')
			.setEmoji('🔢');
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(changeNameButton, changeUserLimitButton, toggleLockButton);
		return { embeds: [embed], components: [row] };
	}

	private async createPanelChannel(guild: Guild) {
		let panel = this.container.tempchannelManager.getPanel(guild.id);

		if (!panel) return;
		const panelChannel = await guild.channels.create({
			name: 'Create Your Channel',
			type: ChannelType.GuildVoice,
			reason: 'Discord Temp Channels Bot'
		});

		try {
			await this.container.prisma.panel.create({
				data: {
					channelId: panelChannel.id,
					guildId: guild.id
				}
			});
			this.container.tempchannelManager.addPanel(guild.id, panelChannel.id);
			return panelChannel;
		} catch (error) {
			console.log(error);
			return null;
		}
	}
}
