import * as Minio from 'minio';
import { env } from '$env/dynamic/private';

if (!env.OBJ_ENDPOINT) throw new Error('OBJ_ENDPOINT is not set');
if (!env.OBJ_PORT) throw new Error('OBJ_PORT is not set');
if (!env.OBJ_USE_SSL) throw new Error('OBJ_USE_SSL is not set');
if (!env.OBJ_ACCESS_KEY) throw new Error('OBJ_ACCESS_KEY is not set');
if (!env.OBJ_SECRET_KEY) throw new Error('OBJ_SECRET_KEY is not set');

const minioClient = new Minio.Client({
	endPoint: env.OBJ_ENDPOINT,
	port: parseInt(env.OBJ_PORT),
	useSSL: env.OBJ_USE_SSL === 'true',
	accessKey: env.OBJ_ACCESS_KEY,
	secretKey: env.OBJ_SECRET_KEY
});

async function ensureBucketExists(bucketName: string) {
	try {
		const exists = await minioClient.bucketExists(bucketName);
		if (!exists) {
			await minioClient.makeBucket(bucketName);
			console.log(`Bucket ${bucketName} created successfully`);
		}
	} catch (error) {
		console.error(`Error ensuring bucket ${bucketName} exists:`, error);
		throw error;
	}
}

async function uploadFile(bucketName: string, objectName: string, filePath: string) {
	try {
		await ensureBucketExists(bucketName);
		const res = await minioClient.fPutObject(bucketName, objectName, filePath);
		return res;
	} catch (error) {
		console.error('Error uploading file:', error);
		throw error;
	}
}

async function uploadBuffer(
	bucketName: string,
	objectName: string,
	buffer: Buffer,
	contentType?: string
) {
	try {
		await ensureBucketExists(bucketName);
		const metaData = contentType ? { 'Content-Type': contentType } : {};
		const res = await minioClient.putObject(
			bucketName,
			objectName,
			buffer,
			buffer.length,
			metaData
		);
		return res;
	} catch (error) {
		console.error('Error uploading buffer:', error);
		throw error;
	}
}

export async function uploadFileHelper(
	filePath: string,
	bucketName: string,
	objectName: string
): Promise<string> {
	await uploadFile(bucketName, objectName, filePath);
	return `${env.OBJ_URL_PREFIX}/${bucketName}/${objectName}`;
}

export async function uploadBufferHelper(
	buffer: Buffer,
	bucketName: string,
	objectName: string,
	contentType?: string
): Promise<string> {
	await uploadBuffer(bucketName, objectName, buffer, contentType);
	return `${env.OBJ_URL_PREFIX}/${bucketName}/${objectName}`;
}

export async function deleteFile(bucketName: string, objectName: string): Promise<void> {
	try {
		await minioClient.removeObject(bucketName, objectName);
	} catch (error) {
		console.error('Error deleting file:', error);
		throw error;
	}
}

export async function listFiles(bucketName: string, prefix?: string): Promise<string[]> {
	try {
		const objects: string[] = [];
		const stream = minioClient.listObjects(bucketName, prefix, true);

		return new Promise((resolve, reject) => {
			stream.on('data', (obj) => {
				if (obj.name) {
					objects.push(obj.name);
				}
			});
			stream.on('error', reject);
			stream.on('end', () => resolve(objects));
		});
	} catch (error) {
		console.error('Error listing files:', error);
		throw error;
	}
}

export async function getPresignedUrl(
	schoolId: string,
	objectName: string,
	expiry: number = 7 * 24 * 60 * 60 // 7 days in seconds
): Promise<string> {
	const bucketName = `schools`;
	const fullObjectName = `${schoolId}/${objectName}`;

	try {
		const url = await minioClient.presignedGetObject(bucketName, fullObjectName, expiry);
		return url;
	} catch (error) {
		console.error('Error generating presigned URL:', error);
		throw error;
	}
}

export async function getFileStream(schoolId: string, objectName: string) {
	const bucketName = `schools`;
	const fullObjectName = `${schoolId}/${objectName}`;

	try {
		const stream = await minioClient.getObject(bucketName, fullObjectName);
		return stream;
	} catch (error) {
		console.error('Error getting file stream:', error);
		throw error;
	}
}

export async function getFileFromStorage(schoolId: string, objectName: string) {
	const bucketName = `schools`;
	const fullObjectName = `${schoolId}/${objectName}`;

	try {
		const stream = await minioClient.getObject(bucketName, fullObjectName);

		// Convert stream to buffer
		const chunks: Buffer[] = [];
		for await (const chunk of stream) {
			chunks.push(chunk);
		}
		return Buffer.concat(chunks);
	} catch (error) {
		console.error('Error getting file from storage:', error);
		throw error;
	}
}

export async function getFileMetadata(schoolId: string, objectName: string) {
	const bucketName = `schools`;
	const fullObjectName = `${schoolId}/${objectName}`;

	try {
		const stat = await minioClient.statObject(bucketName, fullObjectName);
		return {
			size: stat.size,
			lastModified: stat.lastModified,
			etag: stat.etag,
			contentType: stat.metaData?.['content-type']
		};
	} catch (error) {
		console.error('Error getting file metadata:', error);
		throw error;
	}
}

export function generateUniqueFileName(originalName: string): string {
	const timestamp = Date.now();
	const randomString = Math.random().toString(36).substring(2, 8);
	const extension = originalName.split('.').pop();
	const baseName = originalName.split('.').slice(0, -1).join('.');
	return `${baseName}_${timestamp}_${randomString}.${extension}`;
}
