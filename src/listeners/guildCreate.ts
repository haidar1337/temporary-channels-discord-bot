import { Events, Listener } from '@sapphire/framework';
import { Guild } from 'discord.js';

export class GuildCreateEvent extends Listener {
	public constructor(context: Listener.LoaderContext) {
		super(context, { event: Events.GuildCreate });
	}

	public override async run(guild: Guild) {
		try {
			await this.container.prisma.guild.create({
				data: {
					guildId: guild.id
				}
			});
		} catch (error) {
			this.container.logger.error(error);
		}
	}
}
