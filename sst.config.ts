// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
	app(input) {
		return {
			name: 'eddi',
			removal: input?.stage === 'production' ? 'retain' : 'remove',
			protect: ['production'].includes(input?.stage),
			home: 'aws'
		};
	},
	async run() {
		const vpc = new sst.aws.Vpc('vpc');

		// pgvector is built in
		// https://aws.amazon.com/about-aws/whats-new/2023/05/amazon-rds-postgresql-pgvector-ml-model-integration/
		const database = new sst.aws.Postgres('database', {
			vpc
		});

		const bucket = new sst.aws.Bucket('schools');

		const cluster = new sst.aws.Cluster('cluster', {
			vpc
		});

		const fet = new sst.aws.Task('fet', {
			cluster,
			link: [database, bucket],
			image: {
				context: './infra/fet',
				dockerfile: 'Dockerfile'
			}
		});

		const email = new sst.aws.Email('email', {
			sender: 'no-reply@eddi.com.au'
		});

		const app = new sst.aws.SvelteKit('app', {
			link: [bucket, fet, database, email],
			domain: {
				name: 'eddi.com.au',
				redirects: ['www.eddi.com.au'],
				aliases: ['*.eddi.com.au']
			}
		});

		return {
			resources: { vpc, database, bucket, cluster, fet, email, app }
		};
	}
});
