"use strict";
const lib = require("@clusterio/lib");


class ControllerConfigGroup extends lib.PluginConfigGroup {}
ControllerConfigGroup.defaultAccess = ["controller", "host", "control"];
ControllerConfigGroup.groupName = "fagc_integration";
ControllerConfigGroup.define({
	name: "api_url",
	title: "API URL",
	description: "URL to FAGC API.",
	type: "string",
	optional: true,
	initial_value: "https://factoriobans.club/",
});
ControllerConfigGroup.define({
	name: "api_key",
	title: "API Key",
	description: "Authentication key for FAGC API.",
	type: "string",
	optional: true,
});
ControllerConfigGroup.define({
	name: "discord_guild_id",
	title: "Discord Guild ID",
	description: "Discord guild to use as basis for community settings.",
	type: "string",
	optional: true,
});
ControllerConfigGroup.finalize();

lib.definePermission({
	name: "fagc_integration.guild.get_own",
	title: "Get details for Discord server",
	description: "Get FAGC details for the Discord Server set in the controller config.",
	grantByDefault: true,
});
lib.definePermission({
	name: "fagc_integration.guild.set_own_config",
	title: "Set details for Discord server",
	description: "Set FAGC details for the Discord Server set in the controller config.",
});
lib.definePermission({
	name: "fagc_integration.community.get_own",
	title: "Get own FAGC community",
	description: "Get details for the community the API key is issued to.",
	grantByDefault: true,
});
lib.definePermission({
	name: "fagc_integration.community.list",
	title: "List FAGC communities",
	description: "Get the full list of communities present on FAGC.",
	grantByDefault: true,
});
lib.definePermission({
	name: "fagc_integration.category.list",
	title: "List FAGC categories",
	description: "Get the full list of categories present on FAGC.",
	grantByDefault: true,
});
lib.definePermission({
	name: "fagc_integration.report.list",
	title: "List FAGC reports",
	description: "View all reports present on FAGC.",
	grantByDefault: true,
});
lib.definePermission({
	name: "fagc_integration.report.get",
	title: "Get FAGC report",
	description: "Get the details of a report on FAGC.",
	grantByDefault: true,
});
lib.definePermission({
	name: "fagc_integration.report.create",
	title: "Create FAGC report",
	description: "Report players to FAGC.",
});
lib.definePermission({
	name: "fagc_integration.report.revoke",
	title: "Revoke FAGC report",
	description: "Revoke existing report from this community.",
});
lib.definePermission({
	name: "fagc_integration.revocation.list",
	title: "List FAGC revocations",
	description: "View all revocations from this community.",
});
lib.definePermission({
	name: "fagc_integration.revocation.get",
	title: "Get FAGC revocation",
	description: "Get the details of a revocation from this community on FAGC.",
});

const community = {
	type: "object",
	required: ["id", "name", "contact", "guildIds"],
	properties: {
		"id": { type: "string" },
		"name": { type: "string" },
		"contact": { type: "string" },
		"guildIds": { type: "array", items: { type: "string" }},
	}
}

const report = {
	type: "object",
	required: [
		"id", "playername", "categoryId", "proof", "description",
		"automated", "reportedTime", "adminId", "reportCreatedAt",
	],
	properties: {
		"id": { type: "string" },
		"playername": { type: "string" },
		"categoryId": { type: "string" },
		"proof": { type: "string" },
		"description": { type: "string" },
		"automated": { type: "boolean" },
		"reportedTime": { type: "string" },
		"adminId": { type: "string" },
		"reportCreatedAt": { type: "string" },
	},
}

const revocation = {
	type: "object",
	required: [...report.required, "revokedAt", "revokedBy"],
	properties: {
		...report.properties,
		"revokedAt": { type: "string" },
		"revokedBy": { type: "string" },
	}
}

module.exports = {
	name: "fagc_integration",
	title: "FAGC Integration",
	description: "Report players through Factorio Anti-Greifer Cooperation",

	controllerEntrypoint: "controller",
	ControllerConfigGroup,

	webEntrypoint: "./web",
	routes: [
		"/fagc/discord-server",
		"/fagc/communities",
		"/fagc/categories",
		"/fagc/reports",
		"/fagc/reports/:id",
		"/fagc/revocations",
		"/fagc/revocations/:id"
	],

	messages: {
		getOwnCommunity: new lib.Request({
			type: "fagc_integration:get_own_community",
			links: ["control-controller"],
			permission: "fagc_integration.community.get_own",
			responseProperties: {
				"community": {
					oneOf: [
						{ type: "null" },
						community,
					],
				},
			},
		}),
		listCommunities: new lib.Request({
			type: "fagc_integration:list_communities",
			links: ["control-controller"],
			permission: "fagc_integration.community.list",
			responseProperties: {
				"list": {
					type: "array",
					items: community,
				},
			},
		}),
		listCategories: new lib.Request({
			type: "fagc_integration:list_categories",
			links: ["control-controller"],
			permission: "fagc_integration.category.list",
			responseProperties: {
				"list": {
					type: "array",
					items: {
						type: "object",
						required: ["id", "name", "description"],
						properties: {
							"id": { type: "string" },
							"name": { type: "string" },
							"description": { type: "string" },
						}
					},
				},
			},
		}),
		listReports: new lib.Request({
			type: "fagc_integration:list_reports",
			links: ["control-controller"],
			permission: "fagc_integration.report.list",
			requestRequired: [],
			requestProperties: {
				"playername": { type: "string" },
			},
			responseProperties: {
				"list": {
					type: "array",
					items: report,
				},
			},
		}),
		getReport: new lib.Request({
			type: "fagc_integration:get_report",
			links: ["control-controller"],
			permission: "fagc_integration.report.get",
			requestProperties: {
				"id": { type: "string" },
			},
			responseProperties: {
				"report": {
					oneOf: [
						{ type: "null" },
						report,
					],
				}
			},
		}),
		createReport: new lib.Request({
			type: "fagc_integration:create_report",
			links: ["control-controller"],
			permission: "fagc_integration.report.create",
			requestProperties: {
				"report": {
					type: "object",
					required: [
						"playername", "categoryId", "adminId"
					],
					properties: {
						"playername": { type: "string" },
						"categoryId": { type: "string" },
						"proof": { type: "string" },
						"description": { type: "string" },
						"automated": { type: "boolean" },
						"adminId": { type: "string" },
					},
				},
			},
			responseProperties: {
				"id": { type: "string" },
			},
		}),
		revokeReport: new lib.Request({
			type: "fagc_integration:revoke_report",
			links: ["control-controller"],
			permission: "fagc_integration.report.revoke",
			requestProperties: {
				"reportId": { type: "string" },
				"adminId": { type: "string" },
			},
		}),
		getRevocation: new lib.Request({
			type: "fagc_integration:get_revocation",
			links: ["control-controller"],
			permission: "fagc_integration.revocation.get",
			requestProperties: {
				"id": { type: "string" },
			},
			responseProperties: {
				"revocation": {
					oneOf: [
						{ type: "null" },
						revocation,
					],
				}
			},
		}),
		listRevocations: new lib.Request({
			type: "fagc_integration:list_revocations",
			links: ["control-controller"],
			permission: "fagc_integration.revocation.list",
			responseProperties: {
				"list": {
					type: "array",
					items: revocation,
				},
			},
		}),
		getOwnGuild: new lib.Request({
			type: "fagc_integration:get_own_guild",
			links: ["control-controller"],
			permission: "fagc_integration.guild.get_own",
			responseProperties: {
				"guild": {
					type: ["object", "null"],
					properties: {
						"trustedCommunities": {
							type: "array",
							items: { type: "string" },
						},
						"categoryFilters": {
							type: "array",
							items: { type: "string" },
						},
					},
				},
			},
		}),
		setOwnGuildConfig: new lib.Request({
			type: "fagc_integration:set_own_guild_config",
			links: ["control-controller"],
			permission: "fagc_integration.guild.set_own_config",
			requestRequired: [],
			requestProperties: {
				"trustedCommunities": {
					type: "array",
					items: { type: "string" },
				},
				"categoryFilters": {
					type: "array",
					items: { type: "string" },
				},
			},
		}),
	},
};
