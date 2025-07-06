import * as Minio from 'minio';
import { env } from '$env/dynamic/private';
import type { UploadedObjectInfo } from 'minio/index';

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

export async function uploadFile(
	bucketName: string,
	objectName: string,
	filePath: string
): Promise<UploadedObjectInfo> {
	try {
		const res = await minioClient.fPutObject(bucketName, objectName, filePath);
		return res;
	} catch (error) {
		console.error('Error uploading file:', error);
		throw error;
	}
}
