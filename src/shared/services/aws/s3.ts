import { Inject } from "@nestjs/common";
import { GetObjectCommand, PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface S3ServiceConfig {
    config: S3ClientConfig;
    // Bucket name
    domain: string;
};

export interface S3ServiceOptions {
    client: S3Client;
    bucket: string;
}

export interface S3ServiceUploadOptions {
    name: string;
    rawData: Buffer;
    type?: string;
}

export class S3Service {
    constructor(@Inject('S3_SERVICE_CLIENT') private options: S3ServiceOptions) { }

    static register(options: S3ServiceConfig): S3Service {
        const client = new S3Client(options.config);
        return new S3Service({ client, bucket: options.domain });
    }

    async putObjectWithSignedUrl(name: string) {
        return getSignedUrl(this.options.client, new PutObjectCommand({ Bucket: this.options.bucket, Key: name }))
    }

    async upload(options: S3ServiceUploadOptions) {
        const { name, rawData, type } = options;
        await this.options.client.send(new PutObjectCommand({
            Key: name,
            Bucket: this.options.bucket,
            Body: rawData,
            ContentType: type
        }));
        return;
    }

    async getObjectWithSignedUrl(name: string) {
        return getSignedUrl(
            this.options.client,
            new GetObjectCommand({
                Bucket: this.options.bucket,
                Key: name,
            })
        );
    }
}