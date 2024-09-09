import * as minio from "minio";

var minioClient = new minio.Client({
    endPoint: process.env.REACT_APP_FILE_SERVICE_ENDPOINT,
    port: Number(process.env.REACT_APP_FILE_SERVICE_PORT),
    useSSL: Boolean(process.env.REACT_APP_FILE_SERVICE_SSL_ENABLED),
    accessKey: process.env.REACT_APP_FILE_SERVICE_ACCESS_KEY,
    secretKey: process.env.REACT_APP_FILE_SERVICE_SECRET_KEY,
})

export function getPresignedLink(bucket, key, durationInSecond, fnCallback) {
    minioClient.presignedGetObject(bucket, key, durationInSecond, fnCallback)
}

export function getPresignedLinkWithDefaultDuration(bucket, key, fnCallback) {
    getPresignedLink(bucket, key, 300, fnCallback)
}

export const uploadBlob = (bucket, key, blob, filename) => {
    var file = new File([blob], filename)
    return minioClient.putObject(bucket, key, file.stream(), file.size)
}

export const uploadBlobToPresignedURL = (bucket, key, blob, filename) => {
    var file = new File([blob], filename)
    return minioClient.presignedGetObject(bucket, key, 300)
        .then((url) => {
            return fetch(url, {
                method: 'PUT',
                body: file
            }).then(rsp => {
                if (rsp.ok) {
                    return url
                }
                return null
            }).catch(e => {
                console.error("Failed to upload file %s", filename)
                console.log(e)
                return null
            })
        })
}