import path from 'path';

export function getMimeType(filePath: string): string {
	const ext = path.extname(filePath).toLowerCase();
	switch (ext) {
		case '.jpg':
		case '.jpeg':
			return 'image/jpeg';
		case '.png':
			return 'image/png';
		case '.pdf':
			return 'application/pdf';
		default:
			return 'application/octet-stream';
	}
}
