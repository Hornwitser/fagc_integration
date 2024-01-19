import React, { useContext, useEffect, useState } from "react";
import {
	Alert, Button, Col, Descriptions, Form, Input, Modal, PageHeader,
	Popconfirm, Row, Select, Spin, Table, Tag, Typography,
} from "antd";
import events from "events";
import { useHistory, useParams } from "react-router-dom";

import * as lib from "@clusterio/lib";
import { notifyErrorHandler, useAccount, PageLayout, SectionHeader, ControlContext } from "@clusterio/web_ui";
import info from "../info";

const { Title } = Typography;

const strcmp = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }).compare;
const hexcmp = new Intl.Collator(undefined, { sensitivity: "base" }).compare;


let cachedCategories;
let categoriesEmitter;
function useCategories() {
	let control = useContext(ControlContext);
	let [categories, setCategories] = useState([]);

	useEffect(() => {
		if (cachedCategories) {
			return setCategories(cachedCategories);
		}

		if (!categoriesEmitter) {
			categoriesEmitter = new events.EventEmitter();
			info.messages.listCategories.send(control).then(result => {
				cachedCategories = result.list;
				categoriesEmitter.emit("set", result.list);
			}).catch(notifyErrorHandler("Error fetching categories"));
		}

		categoriesEmitter.on("set", setCategories);
		return () => {
			categoriesEmitter.off("set", setCategories);
		}
	}, []);

	return categories;
}

function categoryName(categoryId, categories) {
	return (categories.find(category => category.id === categoryId) || { name: categoryId }).name;
}

function useOwnGuild() {
	let control = useContext(ControlContext);
	let [guild, setGuild] = useState({ loading: true });

	useEffect(() => {
		info.messages.getOwnGuild.send(control).then(result => {
			if (!result.guild) {
				setGuild({ missing: true });
			} else {
				setGuild(result.guild);
			}
		}).catch(err => {
			setGuild({ error: err.message });
		});
	}, []);

	return guild;
}

let cachedOwnCommunity;
let ownCommunityEmitter;
function useOwnCommunity() {
	let control = useContext(ControlContext);
	let [community, setCommunity] = useState(null);

	useEffect(() => {
		if (cachedOwnCommunity) {
			return setCommunity(cachedOwnCommunity);
		}

		if (!ownCommunityEmitter) {
			ownCommunityEmitter = new events.EventEmitter();
			info.messages.getOwnCommunity.send(control).then(result => {
				cachedOwnCommunity = result.community;
				ownCommunityEmitter.emit("set", result.community);
			}).catch(notifyErrorHandler("Error fetching own community"));
		}

		ownCommunityEmitter.on("set", setCommunity);
		return () => {
			ownCommunityEmitter.off("set", setCommunity);
		};
	}, []);

	return community;
}

let cachedCommunities;
let communitiesEmitter;
function useCommunities() {
	let control = useContext(ControlContext);
	let [communities, setCommunities] = useState([]);

	useEffect(() => {
		if (cachedCommunities) {
			return setCommunities(cachedCommunities);
		}

		if (!communitiesEmitter) {
			communitiesEmitter = new events.EventEmitter();
			info.messages.listCommunities.send(control).then(result => {
				cachedCommunities = result.list;
				communitiesEmitter.emit("set", result.list);
			}).catch(notifyErrorHandler("Error fetching communities"));
		}

		communitiesEmitter.on("set", setCommunities);
		return () => {
			communitiesEmitter.off("set", setCommunities);
		};
	}, []);

	return communities;
}

function communityName(communityId, communities) {
	return (communities.find(community => community.id == communityId) || { name: communityId }).name;
}

function GuildMultiConfig(props) {
	let account = useAccount();
	let control = useContext(ControlContext);

	let [elementsDirty, setElementsDirty] = useState(false);
	let [applyingElements, setApplyingElements] = useState(false);
	let [elementsError, setElementsError] = useState(null);

	return <Row gutter={8} style={{ flexWrap: "nowrap" }}>
		<Col flex="auto">
			{account.hasPermission("fagc_integration.guild.set_own_config")
				? <Form.Item
					noStyle
					name={props.name}
					initialValue={props.guild[props.name]}
					rules={[
						{ validator: () => (elementsError ? Promise.reject(elementsError) : Promise.resolve()) },
					]}
				>
					<Select
						onChange={() => setElementsDirty(true)}
						mode="multiple"
						showArrow={true}
						filterOption={(inputValue, option) => {
							let element = props.elements.find(e => e.id === option.value);
							return element && element.name.toLowerCase().includes(inputValue.toLowerCase());
						}}
					>
						{props.elements.map(e => <Select.Option
							key={e.id}
							value={e.id}
							title={e.description || e.name}
						>{e.name}</Select.Option>)}
					</Select>
				</Form.Item>
				: props.guild[props.name].map(id => <Tag key={id}>{
					props.nameFunc(id, props.elements)
				}</Tag>)
			}
		</Col>
		{account.hasPermission("fagc_integration.guild.set_own_config")
			&& <Col flex="0 0 auto">
				<Button
					type="primary"
					disabled={!elementsDirty}
					loading={applyingElements}
					onClick={() => {
						let newElements = props.form.getFieldValue(props.name)
						setApplyingElements(true);
						info.messages.setOwnGuildConfig.send(control, {
							[props.name]: newElements,
						}).then(() => {
							setElementsDirty(false);
							setElementsError(null);
						}).catch(err => {
							setElementsError(err.message);
						}).finally(() => {
							setApplyingElements(false);
							return props.form.validateFields();
						});
					}}
				>Apply</Button>
			</Col>
		}
	</Row>;
}

function DiscordServerPage() {
	let account = useAccount();
	let ownGuild = useOwnGuild();
	let communities = useCommunities();
	let categories = useCategories();
	let [form] = Form.useForm();

	const nav = [{ name: "FAGC", }, { name: "Discord Server" }]
	if (ownGuild.loading) {
		return <PageLayout nav={nav}>
			<PageHeader
				className="site-page-header"
				title={"Discord Server"}
			/>
			<Spin size="large" />
		</PageLayout>;
	}

	if (ownGuild.missing || ownGuild.error) {
		return <PageLayout nav={nav}>
			<PageHeader
				className="site-page-header"
				title={"Discord Server"}
			/>
			<Alert
				message={ownGuild.error ? "Unexpected error" : `Discord server not configured` }
				showIcon
				description={
					ownGuild.error
						? ownGuild.error
						: `You need to configure a Discord server in the controller config to use this page.`
				}
				type={ownGuild.error ? "error" : "info"}
			/>
		</PageLayout>;
	}

	if (ownGuild.loading) {
		return <PageLayout nav={nav}>
			<PageHeader
				className="site-page-header"
				title={"Discord Server"}
			/>
			<Spin size="large" />
		</PageLayout>;
	}

	return <PageLayout nav={nav}>
		<PageHeader
			className="site-page-header"
			title={"Discord Server"}
		/>
		<Form form={form}>
			<Form.Item label="Trusted Communities">
				<GuildMultiConfig
					form={form}
					guild={ownGuild}
					name="trustedCommunities"
					nameFunc={communityName}
					elements={communities}
				/>
			</Form.Item>
			<Form.Item label="Category Filters">
				<GuildMultiConfig
					form={form}
					guild={ownGuild}
					name="categoryFilters"
					nameFunc={categoryName}
					elements={categories}
				/>
			</Form.Item>
		</Form>
	</PageLayout>;
}

function CommunitiesPage() {
	let control = useContext(ControlContext);
	let [communities, setCommunities] = useState([]);

	useEffect(() => {
		info.messages.listCommunities.send(control).then(result => {
			setCommunities(result.list);
		}).catch(notifyErrorHandler("Error fetching communities"));
	}, []);

	return <PageLayout nav={[{ name: "FAGC", }, { name: "Communities" }]}>
		<PageHeader
			className="site-page-header"
			title="Communities"
		/>
		<Table
			columns={[
				{
					title: "ID",
					dataIndex: "id",
					sorter: (a, b) => hexcmp(a.id, b.id),
				},
				{
					title: "Name",
					dataIndex: "name",
					defaultSortOrder: "ascend",
					sorter: (a, b) => strcmp(a.name, b.name),
				},
				{
					title: "Contact",
					dataIndex: "contact",
					sorter: (a, b) => strcmp(a.contact, b.contact),
				},
				{
					title: "Guilds",
					key: "guilds",
					render: item => item.guildIds.join(", "),
				},
			]}
			dataSource={communities}
			rowKey={item => item.id}
			pagination={false}
		/>
	</PageLayout>;
}

function CategoriesPage() {
	let categories = useCategories();
	return <PageLayout nav={[{ name: "FAGC", }, { name: "Categories" }]}>
		<PageHeader
			className="site-page-header"
			title="Categories"
		/>
		<Table
			columns={[
				{
					title: "ID",
					dataIndex: "id",
					sorter: (a, b) => hexcmp(a.id, b.id),
				},
				{
					title: "Name",
					dataIndex: "name",
					sorter: (a, b) => strcmp(a.name, b.name),
				},
				{
					title: "Description",
					dataIndex: "description",
				},
			]}
			dataSource={categories}
			rowKey={item => item.id}
			pagination={false}
		/>
	</PageLayout>;
}

function ReportsTable(props) {
	let categories = useCategories();
	let communities = useCommunities();
	let history = useHistory();

	return <Table
		columns={[
			{
				title: "ID",
				dataIndex: "id",
				sorter: (a, b) => hexcmp(a.id, b.id),
			},
			...(!props.revocations ? [{
				title: "Community",
				key: "community",
				render: report => communityName(report.communityId, communities),
				sorter: (a, b) => strcmp(
					communityName(a.communityId, communities),
					communityName(b.communityId, communities)
				),
			}] : []),
			...(props.includeName ? [{
				title: "Player",
				dataIndex: "playername",
				defaultSortOrder: "ascend",
				sorter: (a, b) => strcmp(a.playername, b.playername),
			}] : []),
			{
				title: "Category",
				key: "categoryId",
				render: report => categoryName(report.categoryId, categories),
				sorter: (a, b) => strcmp(
					categoryName(a.categoryId, categories), categoryName(b.categoryId, categories)
				),
			},
			{
				title: "At",
				key: "reportedTime",
				render: report => report.reportedTime.replace("T", " "),
				sorter: (a, b) => strcmp(a.reportedTime, b.reportedTime),
				...(!props.includeName ? { defaultSortOrder: "decend" } : {}),
			},
		]}
		dataSource={props.reports}
		rowKey={report => report.id}
		onRow={(report, rowIndex) => ({
			onClick: event => {
				history.push(`/fagc/${props.revocations ? "revocations" : "reports"}/${report.id}`);
			},
		})}
		pagination={false}
	/>
}

function ReportsPage() {
	let control = useContext(ControlContext);
	let [reports, setReports] = useState([]);

	useEffect(() => {
		info.messages.listReports.send(control).then(result => {
			setReports(result.list);
		}).catch(notifyErrorHandler("Error fetching reports"));
	}, []);

	return <PageLayout nav={[{ name: "FAGC", }, { name: "Reports" }]}>
		<PageHeader
			className="site-page-header"
			title="Reports"
		/>
		<ReportsTable reports={reports} includeName />
	</PageLayout>;
}

function ReportPage(props) {
	let params = useParams();
	let reportId = params.id;
	let history = useHistory();
	let control = useContext(ControlContext);
	let account = useAccount();
	let [report, setReport] = useState({ loading: true });
	let categories = useCategories();
	let ownCommunity = useOwnCommunity();
	let communities = useCommunities();

	useEffect(() => {
		let request;
		if (props.revocation) {
			request = info.messages.getRevocation.send(control, { id: reportId }).then(result => {
				if (result.revocation) {
					setReport(result.revocation);
				} else {
					setReport({ missing: true })
				}
			});
		} else {
			request = info.messages.getReport.send(control, { id: reportId }).then(result => {
				if (result.report) {
					setReport(result.report);
				} else {
					setReport({ missing: true })
				}
			});
		}
		request.catch(err => { setReport({ error: err.message }) });
	}, [reportId]);

	const type = props.revocation ? "Revocation" : "Report"
	const title = `${type} ${reportId}`;
	const nav = [
		{ name: "FAGC", },
		{
			name: `${props.revocation ? "Revocations" : "Reports"}`,
			path: `/fagc/${props.revocation ? "revocations" : "reports"}`,
		},
		{ name: title },
	];

	if (report.loading) {
		return <PageLayout nav={nav}>
			<PageHeader
				className="site-page-header"
				title={title}
			/>
			<Spin size="large" />
		</PageLayout>;
	}

	if (report.missing || report.error) {
		return <PageLayout nav={nav}>
			<PageHeader
				className="site-page-header"
				title={title}
			/>
			<Alert
				message={report.error ? "Unexpected error" : `${type} not found` }
				showIcon
				description={report.error ? report.error : `${type} with id ${reportId} is not present on FAGC.`}
				type={report.error ? "error" : "warning"}
			/>
		</PageLayout>;
	}

	return <PageLayout nav={nav}>
		<PageHeader
			className="site-page-header"
			title={title}
			extra={
				!props.revocation
				&& account.hasPermission("fagc_integration.report.revoke")
				&& ownCommunity && report.communityId === ownCommunity.id
				&& <Popconfirm
					title="Revoke report from FAGC?"
					okText="Revoke"
					placement="bottomRight"
					okButtonProps={{ danger: true }}
					onConfirm={() => {
						info.messages.revokeReport.send(
							control, { reportId: report.id, adminId: report.adminId }
						).then(() => {
							history.push(`/fagc/revocations/${report.id}`);
						}).catch(notifyErrorHandler("Error revoking report"));
					}}
				>
					<Button danger>Revoke</Button>
				</Popconfirm>
			}
		/>
		<Descriptions
			bordered
			size="small"
			column={{ xs: 1, sm: 1, md: 1, lg: 2 }}
		>
			<Descriptions.Item label="Player">{report.playername}</Descriptions.Item>
			<Descriptions.Item label="Reported at">{report.reportedTime.replace("T", " ")}</Descriptions.Item>
			<Descriptions.Item label="Community" span={2}>
				{communityName(report.communityId, communities)}
			</Descriptions.Item>
			<Descriptions.Item label="Category">{categoryName(report.categoryId, categories)}</Descriptions.Item>
			<Descriptions.Item label="Automated">{report.automated ? "Yes" : "No"}</Descriptions.Item>
			<Descriptions.Item label="Description" span={2}>{report.description}</Descriptions.Item>
			<Descriptions.Item label="Proof" span={2}>{report.proof}</Descriptions.Item>
			<Descriptions.Item label="Created at" span={2}>
				{report.reportCreatedAt.replace("T", " ")}
			</Descriptions.Item>
			{props.revocation &&
				<Descriptions.Item label="Revoked at" span={2}>{report.revokedAt.replace("T", " ")}</Descriptions.Item>
			}
		</Descriptions>
	</PageLayout>;
}

function RevocationsPage() {
	let control = useContext(ControlContext);
	let [revocations, setRevocations] = useState([]);

	useEffect(() => {
		info.messages.listRevocations.send(control).then(result => {
			setRevocations(result.list);
		}).catch(notifyErrorHandler("Error fetching revocations"));
	}, []);

	return <PageLayout nav={[{ name: "FAGC" }, { name: "Revocations" }]}>
		<PageHeader
			className="site-page-header"
			title="Revocations"
		/>
		<ReportsTable reports={revocations} revocations includeName />
	</PageLayout>;
}

function ReportButton(props) {
	let control = useContext(ControlContext);
	let history = useHistory();
	let [visible, setVisible] = useState(false);
	let [form] = Form.useForm();
	let categories = useCategories();

	async function reportPlayer() {
		let values = form.getFieldsValue();
		if (!values.playername) {
			form.setFields([{ name: "instanceName", errors: ["Name is required"] }]);
			return;
		}

		let response = await info.messages.createReport.send(control, {
			report: {
				playername: values.playername,
				categoryId: values.categoryId,
				proof: values.proof || undefined,
				description: values.description,
				automated: false,
				adminId: values.adminid,
			}
		});
		setVisible(false);
		history.push(`/fagc/reports/${response.id}`);
	}

	return <>
		<Button
			onClick={() => {
				setVisible(true);
			}}
		>Report</Button>
		<Modal
			title="Report Player"
			okText="Report"
			visible={visible}
			onOk={() => { reportPlayer().catch(notifyErrorHandler("Error reporting player")); }}
			onCancel={() => { setVisible(false); }}
			destroyOnClose
		>
			<Form
				labelCol={{ span: 6 }}
				wrapperCol={{ span: 18 }}
				layout="horizontal"
				form={form}
				initialValues={{ playername: props.playername }}
			>
				<Form.Item name="playername" label="Player Name">
					<Input disabled />
				</Form.Item>
				<Form.Item name="categoryId" label="Category">
					<Select
						showSearch
						optionFilterProp="children"
					>
						{categories.map(category => <Select.Option
							key={category.id} value={category.id} title={category.description}>
								{category.name}
							</Select.Option>
						)}
					</Select>
				</Form.Item>
				<Form.Item name="description" label="Description">
					<Input.TextArea autoSize={{ minRows: 2 }} />
				</Form.Item>
				<Form.Item name="proof" label="Proof" help="space sepparated list of URLs to proof">
					<Input />
				</Form.Item>
				<Form.Item name="adminid" label="Reporter" help="Discord ID of who's making the report">
					<Input />
				</Form.Item>
			</Form>
		</Modal>
	</>;
}


function UserViewPageExtra(props) {
	let control = useContext(ControlContext);
	let account = useAccount();
	let [reports, setReports] = useState(null);
	let ownCommunity = useOwnCommunity();

	useEffect(() => {
		if (!account.hasPermission("fagc_integration.report.list")) {
			return;
		}

		info.messages.listReports.send(control, { playername: props.user.name }).then(result => {
			setReports(result.list);
		}).catch(notifyErrorHandler("Error fetching reports"));
	}, [props.user.name]);

	if (!account.hasPermission("fagc_integration.report.list")) {
		return;
	}

	return <>
		<SectionHeader
			title="FAGC Reports"
			extra={
				ownCommunity
				&& account.hasPermission("fagc_integration.report.create")
				&& <ReportButton playername={props.user.name}/>
			}
		/>
		{reports === null ? <Spin/> : reports.length === 0 ? "No reports" : <ReportsTable reports={reports} />}
	</>
}


export class WebPlugin extends lib.BaseWebPlugin {
	async init() {
		this.pages = [
			{
				path: "/fagc/discord-server",
				sidebarGroup: "FAGC",
				sidebarName: "Discord Server",
				permission: "fagc_integration.guild.get_own",
				content: <DiscordServerPage/>,
			},
			{
				path: "/fagc/communities",
				sidebarGroup: "FAGC",
				sidebarName: "Communities",
				permission: "fagc_integration.community.list",
				content: <CommunitiesPage/>,
			},
			{
				path: "/fagc/categories",
				sidebarGroup: "FAGC",
				sidebarName: "Categories",
				permission: "fagc_integration.category.list",
				content: <CategoriesPage/>,
			},
			{
				path: "/fagc/reports",
				sidebarGroup: "FAGC",
				sidebarName: "Reports",
				permission: "fagc_integration.report.list",
				content: <ReportsPage/>,
			},
			{
				path: "/fagc/reports/:id",
				sidebarPath: "/fagc/reports",
				content: <ReportPage/>,
			},
			{
				path: "/fagc/revocations",
				sidebarGroup: "FAGC",
				sidebarName: "Revocations",
				permission: "fagc_integration.revocations.list",
				content: <RevocationsPage/>,
			},
			{
				path: "/fagc/revocations/:id",
				sidebarPath: "/fagc/revocations",
				content: <ReportPage revocation />,
			},
		];

		this.componentExtra = {
			UserViewPage: UserViewPageExtra,
		};

		this.callbacks = [];
	}
}
