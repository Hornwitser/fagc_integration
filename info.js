"use strict";
const lib = require("@clusterio/lib");

class Community {
	/** @type {string} */
	id;
	/** @type {string} */
	name;
	/** @type {string} */
	contact;
	/** @type {array} */
	guildIds;

	constructor(id, name, contact, guildIds) {
		this.id = id;
		this.name = name;
		this.contact = contact;
		this.guildIds = guildIds;
	}

	static jsonSchema = {
		type: "object",
		required: ["id", "name", "contact", "guildIds"],
		properties: {
			"id": { type: "string" },
			"name": { type: "string" },
			"contact": { type: "string" },
			"guildIds": { type: "array", items: { type: "string" }},
		},
	};

	static fromJSON(json) {
		return new this(json.id, json.name, json.contact, json.guildIds);
	}
}

class Report {
	/** @type {string} */
	id;
	/** @type {string} */
	playername;
	/** @type {string} */
	categoryId;
	/** @type {string} */
	proof;
	/** @type {string} */
	description;
	/** @type {boolean} */
	automated;
	/** @type {string} */
	reportedTime;
	/** @type {string} */
	adminId;
	/** @type {string} */
	communityId;
	/** @type {string} */
	reportCreatedAt;

	constructor(
		id,
		playername,
		categoryId,
		proof,
		description,
		automated,
		reportedTime,
		adminId,
		communityId,
		reportCreatedAt
	) {
		this.id = id;
		this.playername = playername;
		this.categoryId = categoryId;
		this.proof = proof;
		this.description = description;
		this.automated = automated;
		this.reportedTime = reportedTime;
		this.adminId = adminId;
		this.communityId = communityId;
		this.reportCreatedAt = reportCreatedAt;
	}

	static jsonSchema = {
		type: "object",
		required: [
			"id", "playername", "categoryId", "proof", "description",
			"automated", "reportedTime", "adminId", "communityId", "reportCreatedAt",
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
			"communityId": { type: "string" },
			"reportCreatedAt": { type: "string" },
		},
	};

	static fromJSON(json) {
		return new this(
			json.id,
			json.playername,
			json.categoryId,
			json.proof,
			json.description,
			json.automated,
			json.reportedTime,
			json.adminId,
			json.communityId,
			json.reportCreatedAt
		);
	}
}


class Revocation extends Report {
	/** @type {string} */
	revokedAt;
	/** @type {string} */
	revokedBy;

	constructor(
		id,
		playername,
		categoryId,
		proof,
		description,
		automated,
		reportedTime,
		adminId,
		communityId,
		reportCreatedAt,
		revokedAt,
		revokedBy,
	) {
		super(
			id,
			playername,
			categoryId,
			proof,
			description,
			automated,
			reportedTime,
			adminId,
			communityId,
			reportCreatedAt
		);
		this.revokedAt = revokedAt;
		this.revokedBy = revokedBy;
	}

	static jsonSchema = {
		type: "object",
		required: [...Report.jsonSchema.required, "revokedAt", "revokedBy"],
		properties: {
			...Report.jsonSchema.properties,
			"revokedAt": { type: "string" },
			"revokedBy": { type: "string" },
		},
	};

	static fromJSON(json) {
		return new this(
			json.id,
			json.playername,
			json.categoryId,
			json.proof,
			json.description,
			json.automated,
			json.reportedTime,
			json.adminId,
			json.communityId,
			json.reportCreatedAt,
			json.revokedBy,
			json.revokedAt,
		);
	}
}

class GetOwnCommunityRequest {
	static type = "request";
	static src = "control";
	static dst = "controller";
	static permission = "fagc_integration.community.get_own";
	static plugin = "fagc_integration";
	static Response = {
		fromJSON: json => (json ? Community.fromJSON(json) : null),
		jsonSchema: {
			oneOf: [
				{ type: "null" },
				Community.jsonSchema,
			],
		},
	};
}

class ListCommunitiesRequest {
	static type = "request";
	static src = "control";
	static dst = "controller";
	static permission = "fagc_integration.community.list";
	static plugin = "fagc_integration";
	static Response = lib.jsonArray(Community);
}

class ListCategoriesRequest {
	static type = "request";
	static src = "control";
	static dst = "controller";
	static permission = "fagc_integration.category.list";
	static plugin = "fagc_integration";
	static Response = lib.jsonArray(
		lib.plainJson({
			type: "object",
			required: ["id", "name", "description"],
			properties: {
				"id": { type: "string" },
				"name": { type: "string" },
				"description": { type: "string" },
			},
		}),
	);
}

class ListReportsRequest {
	static type = "request";
	static src = "control";
	static dst = "controller";
	static permission = "fagc_integration.report.list";
	static plugin = "fagc_integration";

	/** @type {string|undefined} */
	playername;

	constructor(playername) {
		this.playername = playername;
	}

	static jsonSchema = {
		type: "object",
		properties: {
			"playername": { type: "string" },
		},
	};

	static fromJSON(json) {
		return new this(json.playername);
	}

	static Response = lib.jsonArray(Report);
}

class GetReportRequest {
	static type = "request";
	static src = "control";
	static dst = "controller";
	static permission = "fagc_integration.report.get";
	static plugin = "fagc_integration";

	/** @type {string} */
	id;

	constructor(id) {
		this.id = id;
	}

	static jsonSchema = {
		type: "object",
		required: ["id"],
		properties: {
			"id": { type: "string" },
		},
	};

	static fromJSON(json) {
		return new this(json.id);
	}

	static Response = {
		fromJSON: json => (json ? Report.fromJSON(json) : null),
		jsonSchema: {
			oneOf: [
				{ type: "null" },
				Report.jsonSchema,
			],
		},
	};
}

class CreateReportRequest {
	static type = "request";
	static src = "control";
	static dst = "controller";
	static permission = "fagc_integration.report.create";
	static plugin = "fagc_integration";

	/** @type {string} */
	playername;
	/** @type {string} */
	categoryId;
	/** @type {string|undefined} */
	proof;
	/** @type {string|undefined} */
	description;
	/** @type {boolean|undefined} */
	automated;
	/** @type {string} */
	adminId;

	constructor({ playername, categoryId, adminId, proof, description, automated }) {
		this.playername = playername;
		this.categoryId = categoryId;
		this.adminId = adminId;
		if (proof !== undefined) { this.proof = proof; }
		if (description !== undefined) { this.description = description; }
		if (automated !== undefined) { this.automated = automated; }
	}

	static jsonSchema = {
		type: "object",
		required: [
			"playername", "categoryId", "adminId",
		],
		properties: {
			"playername": { type: "string" },
			"categoryId": { type: "string" },
			"proof": { type: "string" },
			"description": { type: "string" },
			"automated": { type: "boolean" },
			"adminId": { type: "string" },
		},
	};

	static fromJSON(json) {
		return new this(json);
	}

	static Response = lib.JsonString;
}

class RevokeReportRequest {
	static type = "request";
	static src = "control";
	static dst = "controller";
	static permission = "fagc_integration.report.revoke";
	static plugin = "fagc_integration";

	/** @type {string} */
	reportId;
	/** @type {string} */
	adminId;

	constructor(reportId, adminId) {
		this.reportId = reportId;
		this.adminId = adminId;
	}

	static jsonSchema = {
		type: "object",
		required: [
			"reportId", "adminId",
		],
		properties: {
			"reportId": { type: "string" },
			"adminId": { type: "string" },
		},
	};

	static fromJSON(json) {
		return new this(json.reportId, json.adminId);
	}
}

class GetRevocationRequest {
	static type = "request";
	static src = "control";
	static dst = "controller";
	static permission = "fagc_integration.revocation.get";
	static plugin = "fagc_integration";

	/** @type {string} */
	id;

	constructor(id) {
		this.id = id;
	}

	static jsonSchema = {
		type: "object",
		required: ["id"],
		properties: {
			"id": { type: "string" },
		},
	};

	static fromJSON(json) {
		return new this(json.id);
	}

	static Response = {
		fromJSON: json => (json ? Revocation.fromJSON(json) : null),
		jsonSchema: {
			oneOf: [
				{ type: "null" },
				Revocation.jsonSchema,
			],
		},
	};
}

class ListRevocationsRequest {
	static type = "request";
	static src = "control";
	static dst = "controller";
	static permission = "fagc_integration.revocation.list";
	static plugin = "fagc_integration";
	static Response = lib.jsonArray(Revocation);
}

class GetOwnGuildRequest {
	static type = "request";
	static src = "control";
	static dst = "controller";
	static permission = "fagc_integration.guild.get_own";
	static plugin = "fagc_integration";
	static Response = lib.plainJson({
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
	});
}

class SetOwnGuildConfigRequest {
	static type = "request";
	static src = "control";
	static dst = "controller";
	static permission = "fagc_integration.guild.set_own_config";
	static plugin = "fagc_integration";

	/** @type {array|undefined} */
	trustedCommunities;
	/** @type {array|undefined} */
	categoryFilters;

	constructor({ trustedCommunities, categoryFilters }) {
		if (trustedCommunities !== undefined) { this.trustedCommunities = trustedCommunities; }
		if (categoryFilters !== undefined) { this.categoryFilters = categoryFilters; }
	}

	static jsonSchema = {
		type: "object",
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
	};

	static fromJSON(json) {
		return new this(json);
	}
}

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

const plugin = {
	name: "fagc_integration",
	title: "FAGC Integration",
	description: "Report players through Factorio Anti-Greifer Cooperation",

	controllerEntrypoint: "controller",
	controllerConfigFields: {
		"fagc_integration.api_url": {
			title: "API URL",
			description: "URL to FAGC API.",
			type: "string",
			optional: true,
			initial_value: "https://factoriobans.club/",
		},
		"fagc_integration.api_key": {
			title: "API Key",
			description: "Authentication key for FAGC API.",
			type: "string",
			optional: true,
		},
		"fagc_integration.discord_guild_id": {
			title: "Discord Guild ID",
			description: "Discord guild to use as basis for community settings.",
			type: "string",
			optional: true,
		},
	},

	webEntrypoint: "./web",
	routes: [
		"/fagc/discord-server",
		"/fagc/communities",
		"/fagc/categories",
		"/fagc/reports",
		"/fagc/reports/:id",
		"/fagc/revocations",
		"/fagc/revocations/:id",
	],

	messages: [
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
	],
};

module.exports = {
	plugin,
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
};
