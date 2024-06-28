import { Collection, VoiceChannel } from 'discord.js';
import { Result, container } from '@sapphire/framework';
import { Panel as PrismaPanel, TempChannel } from '@prisma/client';
import { Status } from '@prisma/client';

export class TempChannelManager {
	// <guildId, channelId>
	private panels: Collection<string, string>;
	// <guildId, tempchannel[]>
	public tempChannels: Collection<string, TempChannel[]>;
	constructor() {
		this.panels = new Collection();
		this.tempChannels = new Collection();
		void this.fetchPanels();
		void this.fetchTempChannels();
	}

	public getPanel(guildId: string): string | undefined {
		return this.panels.get(guildId);
	}

	public getPanels() {
		return this.panels;
	}

	public getTempChannels(guildId: string) {
		return this.tempChannels.get(guildId);
	}

	public getTempChannel(guildId: string, userId: string) {
		return this.tempChannels.get(guildId)?.find((value) => {
			return value.userId === userId;
		});
	}

	public addTempChannel(guildId: string, tempChannel: TempChannel) {
		if (this.tempChannels.has(guildId)) {
			this.tempChannels.get(guildId)?.push(tempChannel);
			console.log(this.getTempChannels(guildId));
		} else {
			let arr = [tempChannel];
			this.tempChannels.set(guildId, arr);
		}
	}

	public isTempChannel(guildId: string, channelId: string) {
		const temp = this.getTempChannels(guildId)?.find((ch) => {
			ch.channelId === channelId;
		});
		if (!temp) return;
		return this.getTempChannels(guildId)?.includes(temp);
	}

	public isPanel(channel: VoiceChannel) {
		return this.getPanel(channel.guildId) === channel.id;
	}

	public addPanel(guildId: string, channelId: string) {
		this.panels.set(guildId, channelId);
	}

	public removePanel(guildId: string) {
		this.panels.delete(guildId);
	}

	public updateTempChannelId(guildId: string, userId: string, newChannelId: string) {
		const tempChannelToUpdate = this.getTempChannels(guildId)?.find((channel) => {
			return channel.userId === userId;
		});
		if (!tempChannelToUpdate) return;
		tempChannelToUpdate!.channelId = newChannelId;
	}

	public deleteTempChannelFromCache(guildId: string, channelId: string) {
		const tempChannelToDelete = this.getTempChannels(guildId)?.find((ch) => {
			return ch.channelId === channelId;
		});
		if (!tempChannelToDelete) return;
		const index = this.getTempChannels(guildId)!.indexOf(tempChannelToDelete);
		this.getTempChannels(guildId)!.splice(index, 1);
	}

	private async fetchTempChannels() {
		const tempChannelsDb = await Result.fromAsync(container.prisma.tempChannel.findMany());
		const result = tempChannelsDb.unwrapOrElse((error) => {
			container.logger.error(error);
			return null;
		});
		for (const tempChannel of result as TempChannel[]) {
			if (this.tempChannels.get(tempChannel.guildId)) {
				this.tempChannels.get(tempChannel.guildId)!.push({
					guildId: tempChannel.guildId,
					name: tempChannel.name,
					status: tempChannel.status,
					id: tempChannel.id,
					userId: tempChannel.userId,
					userLimit: tempChannel.userLimit,
					channelId: tempChannel.channelId
				});
			} else {
				this.tempChannels.set(tempChannel.guildId, [
					{
						guildId: tempChannel.guildId,
						name: tempChannel.name,
						status: tempChannel.status,
						id: tempChannel.id,
						userId: tempChannel.userId,
						userLimit: tempChannel.userLimit,
						channelId: tempChannel.channelId
					}
				]);
			}
		}
		console.log(this.tempChannels);
	}

	public async updateTempChannelName(guildId: string, userId: string, newName: string) {
		const dbRequest = await Result.fromAsync(
			container.prisma.tempChannel.update({
				where: {
					userId_guildId: {
						userId,
						guildId
					}
				},
				data: {
					name: newName
				}
			})
		);
		const result = dbRequest.unwrapOrElse((error) => {
			container.logger.error(error);
			return null;
		});
		const tempChannelToUpdate = this.getTempChannels(guildId)?.find((ch) => {
			return ch.userId === userId;
		});
		tempChannelToUpdate!.name = newName;
		return result;
	}

	public async updateTempChannelLimit(guildId: string, userId: string, newLimit: number) {
		const dbRequest = await Result.fromAsync(
			container.prisma.tempChannel.update({
				where: {
					userId_guildId: {
						userId,
						guildId
					}
				},
				data: {
					userLimit: newLimit
				}
			})
		);
		const result = dbRequest.unwrapOrElse((error) => {
			container.logger.error(error);
			return null;
		});
		const tempChannelToUpdate = this.getTempChannels(guildId)?.find((ch) => {
			return ch.userId === userId;
		});
		tempChannelToUpdate!.userLimit = newLimit;
		return result;
	}

	public async toggleTempChannelLock(guildId: string, userId: string, status: Status) {
		const dbRequest = await Result.fromAsync(
			container.prisma.tempChannel.update({
				where: {
					userId_guildId: {
						userId,
						guildId
					}
				},
				data: {
					status
				}
			})
		);
		const result = dbRequest.unwrapOrElse((error) => {
			container.logger.error(error);
			return null;
		});
		const tempChannelToUpdate = this.getTempChannels(guildId)?.find((ch) => {
			return ch.userId === userId;
		});
		tempChannelToUpdate!.status = status;
		return result;
	}

	private async fetchPanels() {
		const panelsDb = await Result.fromAsync(container.prisma.panel.findMany());
		const result = panelsDb.unwrapOrElse((error) => {
			container.logger.error(error);
			return null;
		});
		for (const panel of result as PrismaPanel[]) {
			this.panels.set(panel.guildId, panel.channelId);
		}
	}

	public async deletePanelFromDb(channelId: string) {
		let deletedPanel = await Result.fromAsync(
			container.prisma.panel.delete({
				where: {
					channelId
				}
			})
		);
		return deletedPanel.unwrapOrElse((error) => {
			container.logger.error(error);
			return null;
		});
	}

	public async createTempChannel(channel: VoiceChannel, channelOwnerId: string) {
		let createdChannel = await Result.fromAsync(
			container.prisma.tempChannel.create({
				data: {
					guildId: channel.guildId,
					name: channel.name,
					status: Status.CLOSE,
					userId: channelOwnerId,
					channelId: channel.id
				}
			})
		);
		return createdChannel.unwrapOrElse((error) => {
			container.logger.error(error);
			return null;
		});
	}
}
