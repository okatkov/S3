import services from '../services';
import { convertToXml } from './apiUtils/bucket/bucketWebsite';
/**
 * Bucket Get Website - Get bucket website configuration
 * @param {AuthInfo} authInfo - Instance of AuthInfo class with requester's info
 * @param {object} request - http request object
 * @param {object} log - Werelogs logger
 * @param {function} callback - callback to server
 * @return {undefined}
 */
export default function bucketGetWebsite(authInfo, request, log, callback) {
    const bucketName = request.bucketName;
    const metadataValParams = {
        authInfo,
        bucketName,
        requestType: 'bucketGetWebsite',
        log,
    };
    services.metadataValidateAuthorization(metadataValParams, (err, bucket) => {
        if (err) {
            log.debug('error processing request',
                { method: 'bucketGetWebsite', error: err });
            return callback(err);
        }
        const websiteConfig = bucket.getWebsiteConfiguration();
        const xml = convertToXml(websiteConfig);

        return callback(null, xml);
    });
}

// write some unit tests?
