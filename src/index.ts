import { PrismaClient } from '@prisma/client';
import './lib/setup';

import { LogLevel, SapphireClient, container } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';

const prisma = new PrismaClient();

const client = new SapphireClient({
	logger: {
		level: LogLevel.Debug
	},
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates]
});
declare module '@sapphire/framework' {
	interface Container {
		prisma: PrismaClient;
	}
}

container.prisma = prisma;

const main = async () => {
	try {
		client.logger.info('Logging in');
		await client.login();
		client.logger.info('logged in');
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

void main();
