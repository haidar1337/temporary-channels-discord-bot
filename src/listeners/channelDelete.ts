import { Events, Listener } from '@sapphire/framework';
import { GuildChannel, VoiceChannel } from 'discord.js';
export class ChannelDeleteEvent extends Listener {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.ChannelDelete });
	}

	public override async run(channel: GuildChannel) {
		if (!(channel instanceof VoiceChannel)) return;
		const tempChannelManager = this.container.tempchannelManager;
		if (tempChannelManager.isTempChannel(channel.guildId, channel.id)) {
			tempChannelManager.deleteTempChannelFromCache(channel.guildId, channel.id);
			return;
		}
		if (!tempChannelManager.isPanel(channel)) return;
		const panel = tempChannelManager.getPanel(channel.guild.id)!;
		const success = await tempChannelManager.deletePanelFromDb(panel);
		if (!success) this.container.logger.error('Something happened');
		tempChannelManager.removePanel(channel.guild.id);
	}
}
