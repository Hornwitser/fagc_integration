"use strict";
const { FAGCWrapper } = require("fagc-api-wrapper");
const libPlugin = require("@clusterio/lib/plugin");
const libErrors = require("@clusterio/lib/errors");


function toISOString(input) {
	if (input instanceof Date) {
		input = input.toISOString();
	}
	return input;
}

function stringifyDates(report) {
	return {
		...report,
		reportedTime: toISOString(report.reportedTime),
		reportCreatedAt: toISOString(report.reportCreatedAt),
		...(report.revokedAt ? { revokedAt: toISOString(report.reportCreatedAt) } : {}),
	};
}

class ControllerPlugin extends libPlugin.BaseControllerPlugin {
	async init() {
		this.createFagcWrapper();
	}

	createFagcWrapper() {
		this.fagc = new FAGCWrapper({
			apiurl: this.controller.config.get("fagc_integration.api_url"),
			apikey: this.controller.config.get("fagc_integration.api_key"),
			// socketurl: ??,
			// enableWebSocket: true,
		});
	}

	async onControllerConfigFieldChanged(group, field, prev) {
		if (group.name === "fagc_integration") {
			if (field === "api_url") {
				this.fagc.setdata({ url: group.get(field) });
			} else if (field === "api_key") {
				this.fagc.setdata({ apikey: group.get(field) });
			}
		}
	}

	async getOwnCommunityRequestHandler() {
		return {
			community: await this.fagc.communities.fetchOwnCommunity({})
		};
	}

	async listCommunitiesRequestHandler() {
		return {
			list: await this.fagc.communities.fetchAll({}),
		};
	}

	async listCategoriesRequestHandler() {
		return {
			list: await this.fagc.categories.fetchAll({})
		};
	}

	async listReportsRequestHandler(message) {
		let { playername } = message.data;
		let list = await this.fagc.reports.fetchAll({ playername });
		list = list.map(stringifyDates);
		return { list };
	}

	async getReportRequestHandler(message) {
		let report = await this.fagc.reports.fetchReport({ reportId: message.data.id });
		if (report !== null) {
			report = stringifyDates(report);
		}
		return { report };
	}

	async createReportRequestHandler(message) {
		let report = await this.fagc.reports.create({ report: message.data.report });
		return { id: report.id };
	}

	async revokeReportRequestHandler(message) {
		let { reportId, adminId } = message.data;
		await this.fagc.revocations.revoke({ reportId, adminId });
	}

	async listRevocationsRequestHandler() {
		let list = await this.fagc.revocations.fetchAll({});
		list = list.map(stringifyDates);
		return { list };
	}

	async getRevocationRequestHandler(message) {
		let revocation = await this.fagc.revocations.fetchRevocation({ revocationId: message.data.id});
		if (revocation !== null) {
			revocation = stringifyDates(revocation);
		}
		return { revocation };
	}

	async getOwnGuildRequestHandler() {
		let guildId = this.controller.config.get("fagc_integration.discord_guild_id");
		if (!guildId) {
			return { guild: null };
		}
		return { guild: await this.fagc.communities.fetchGuildConfig({ guildId }) };
	}

	async setOwnGuildConfigRequestHandler(message) {
		let guildId = this.controller.config.get("fagc_integration.discord_guild_id");
		if (!guildId) {
			throw new libErrors.RequestError("Guild ID not configured");
		}
		await this.fagc.communities.setGuildConfig({ config: {
			guildId,
			trustedCommunities: message.data.trustedCommunities,
			categoryFilters: message.data.categoryFilters,
		}});
	}

	async onShutdown() {
		if (this.fagc) {
			this.fagc.destroy();
		}
	}
}

module.exports = {
	ControllerPlugin,
};
