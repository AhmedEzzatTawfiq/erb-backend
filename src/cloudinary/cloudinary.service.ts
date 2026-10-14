import { Injectable } from "@nestjs/common";
import { v2 as cloudinary } from 'cloudinary';
import { inspect } from 'node:util';

@Injectable()
export class CloudinaryService {
    constructor() {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            debug: true,
        });
    }

    async uploadImage(
        file: Express.Multer.File,
        folder: string
    ) {
        return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: folder,
                resource_type: 'image',
            }, (error, result) => {
                if (error) {
                    console.error(
                        'Cloudinary error:',
                        inspect(error, {
                            depth: 5,
                            colors: false,
                        }),
                    );

                    console.error('Error properties:', {
                        message: error.message,
                        http_code: error.http_code,
                        name: error.name,
                        stack: error.stack,
                    });

                    reject(error);
                    return;
                }

                if (!result) {
                    reject(new Error('Cloudinary upload failed'));
                    return;
                }

                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            })
            uploadStream.end(file.buffer);
        })
    }

    async deleteImage(publicId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(
                publicId,
                { resource_type: 'image' },
                (error, result) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    if (result.result !== 'ok' && result.result !== 'not found') {
                        reject(new Error('Cloudinary delete failed'));
                        return;
                    }

                    resolve();
                });
        });
    }






}