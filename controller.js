"use strict";
const { FAGCWrapper } = require("fagc-api-wrapper");
const lib = require("@clusterio/lib");
const { BaseControllerPlugin } = require("@clusterio/controller");

const {
	GetOwnCommunityRequest,
	ListCommunitiesRequest,
	ListCategoriesRequest,
	ListReportsRequest,
	GetReportRequest,
	CreateReportRequest,
	RevokeReportRequest,
	GetRevocationRequest,
	ListRevocationsRequest,
	GetOwnGuildRequest,
	SetOwnGuildConfigRequest,
} = require("./info");


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

class ControllerPlugin extends BaseControllerPlugin {
	async init() {
		this.createFagcWrapper();

		this.controller.handle(GetOwnCommunityRequest, this.handleGetOwnCommunityRequest.bind(this));
		this.controller.handle(ListCommunitiesRequest, this.handleListCommunitiesRequest.bind(this));
		this.controller.handle(ListCategoriesRequest, this.handleListCategoriesRequest.bind(this));
		this.controller.handle(ListReportsRequest, this.handleListReportsRequest.bind(this));
		this.controller.handle(GetReportRequest, this.handleGetReportRequest.bind(this));
		this.controller.handle(CreateReportRequest, this.handleCreateReportRequest.bind(this));
		this.controller.handle(RevokeReportRequest, this.handleRevokeReportRequest.bind(this));
		this.controller.handle(GetRevocationRequest, this.handleGetRevocationRequest.bind(this));
		this.controller.handle(ListRevocationsRequest, this.handleListRevocationsRequest.bind(this));
		this.controller.handle(GetOwnGuildRequest, this.handleGetOwnGuildRequest.bind(this));
		this.controller.handle(SetOwnGuildConfigRequest, this.handleSetOwnGuildConfigRequest.bind(this));
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

	async handleGetOwnCommunityRequest() {
		return await this.fagc.communities.fetchOwnCommunity({});
	}

	async handleListCommunitiesRequest() {
		return await this.fagc.communities.fetchAll({});
	}

	async handleListCategoriesRequest() {
		return await this.fagc.categories.fetchAll({});
	}

	async handleListReportsRequest(request) {
		let { playername } = request;
		let list = await this.fagc.reports.fetchAll({ playername });
		return list.map(stringifyDates);
	}

	async handleGetReportRequest(request) {
		let report = await this.fagc.reports.fetchReport({ reportId: request.id });
		if (report !== null) {
			report = stringifyDates(report);
		}
		return report;
	}

	async handleCreateReportRequest(request) {
		let report = await this.fagc.reports.create({ report: request });
		return report.id;
	}

	async handleRevokeReportRequest(request) {
		let { reportId, adminId } = request;
		await this.fagc.revocations.revoke({ reportId, adminId });
	}

	async handleListRevocationsRequest() {
		let list = await this.fagc.revocations.fetchAll({});
		return list.map(stringifyDates);
	}

	async handleGetRevocationRequest(request) {
		let revocation = await this.fagc.revocations.fetchRevocation({ revocationId: request.id });
		if (revocation !== null) {
			revocation = stringifyDates(revocation);
		}
		return revocation;
	}

	async handleGetOwnGuildRequest() {
		let guildId = this.controller.config.get("fagc_integration.discord_guild_id");
		if (!guildId) {
			return null;
		}
		const guild = await this.fagc.communities.fetchGuildConfig({ guildId });
		if (!guild) {
			return null;
		}
		return {
			trustedCommunities: guild.trustedCommunities,
			categoryFilters: guild.categoryFilters,
		};
	}

	async handleSetOwnGuildConfigRequest(request) {
		let guildId = this.controller.config.get("fagc_integration.discord_guild_id");
		if (!guildId) {
			throw new lib.RequestError("Guild ID not configured");
		}
		await this.fagc.communities.setGuildConfig({ config: {
			guildId,
			trustedCommunities: request.trustedCommunities,
			categoryFilters: request.categoryFilters,
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
