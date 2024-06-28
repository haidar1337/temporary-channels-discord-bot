import { Status } from '@prisma/client';
import { Events, Listener } from '@sapphire/framework';
import { ChannelType, Collection, Guild, GuildMember, OverwriteResolvable, StageChannel, VoiceChannel, VoiceState } from 'discord.js';

export class VoiceStateUpdateEvent extends Listener {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.VoiceStateUpdate });
	}
	public override async run(old: VoiceState, newState: VoiceState) {
		if (newState.channel instanceof StageChannel) return;
		if (old.channelId === newState.channelId) return;
		if (!newState.channel) {
			this.userLeftTempChannel(old.channel!.guild, old.member!);
			return;
		}
		const tempChannelManager = this.container.tempchannelManager;
		if (!tempChannelManager.isPanel(newState.channel!)) return;
		const channelOwner = newState.member;
		await this.userJoinedPanel(newState.guild, channelOwner!);
	}

	private async userJoinedPanel(guild: Guild, channelOwner: GuildMember) {
		const tempChannel = this.container.tempchannelManager.getTempChannel(guild.id, channelOwner.id);
		const perms: OverwriteResolvable[] = [
			{
				id: guild.roles.everyone.id,
				deny: ['Connect']
			},
			{
				id: channelOwner!.id,
				allow: ['Connect', 'Speak']
			}
		];
		if (tempChannel) {
			let existingChannel = guild.channels.cache.get(tempChannel.channelId);
			if (existingChannel) {
				channelOwner.voice.setChannel(existingChannel as VoiceChannel);
				return;
			}
			if (tempChannel.status === Status.OPEN) {
				perms[0].deny = [];
				perms[0].allow = ['Connect', 'Speak'];
			}
			const temp = await guild.channels.create({
				name: tempChannel.name,
				userLimit: tempChannel.userLimit!,
				type: ChannelType.GuildVoice,
				permissionOverwrites: perms
			});
			await this.container.prisma.tempChannel.update({
				where: {
					userId_guildId: {
						userId: channelOwner.id,
						guildId: guild.id
					}
				},
				data: {
					channelId: temp.id
				}
			});
			this.container.tempchannelManager.updateTempChannelId(guild.id, channelOwner.id, temp.id);
			channelOwner!.voice.setChannel(temp);
		} else {
			const temp = await guild.channels.create({
				name: `${channelOwner.displayName}'s Channel`,
				type: ChannelType.GuildVoice,
				permissionOverwrites: perms
			});
			const success = this.container.tempchannelManager.createTempChannel(temp, channelOwner!.id);
			if (!success) return;

			this.container.tempchannelManager.addTempChannel(guild.id, {
				guildId: guild.id,
				name: `${channelOwner.displayName}'s Channel`,
				userId: channelOwner.id,
				id: '',
				userLimit: 0,
				status: Status.CLOSE,
				channelId: temp.id
			});
			channelOwner!.voice.setChannel(temp);
		}
	}

	private async userLeftTempChannel(guild: Guild, channelOwner: GuildMember) {
		const temp = this.container.tempchannelManager.getTempChannel(guild.id, channelOwner.id);
		if (temp) {
			let existingChannel = await guild.channels.fetch(temp.channelId);
			if (!existingChannel) return;
			if ((existingChannel.members as Collection<string, GuildMember>).values.length >= 1) return;
			await existingChannel.delete('Discord Temp Channels Bot');
			// this.container.tempchannelManager.deleteTempChannelFromCache(guild.id, existingChannel!.id);
		}
	}
}
