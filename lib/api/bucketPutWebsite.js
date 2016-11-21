import { errors } from 'arsenal';
import async from 'async';

import services from '../services';
import { parseWebsiteConfigXml } from './apiUtils/bucket/bucketWebsite';
import metadata from '../metadata/wrapper';


// TODO: Do I put sample XML here or somewhere else?

/**
 * Bucket Put Website - Create bucket website configuration
 * @param {AuthInfo} authInfo - Instance of AuthInfo class with requester's info
 * @param {object} request - http request object
 * @param {object} log - Werelogs logger
 * @param {function} callback - callback to server
 * @return {undefined}
 */
export default function bucketPutWebsite(authInfo, request, log, callback) {
    log.debug('processing request', { method: 'bucketPutWebsite' });
    const bucketName = request.bucketName;
    const metadataValParams = {
        authInfo,
        bucketName,
        requestType: 'bucketPutWebsite',
        log,
    };
    return async.waterfall([
        function waterfall1(next) {
            if (request.post) {
                log.trace('parsing website configuration from request body');
                parseWebsiteConfigXml(request.post, log,
                    (err, config) => next(err, config));
            } else { // If no request body at all
                return next(errors.MissingRequestBodyError);
            }
            return undefined;
        },
        function waterfall2(config, next) {
            services.metadataValidateAuthorization(metadataValParams,
                (err, bucket) => {
                    if (err) {
                        log.trace('request authorization failed', {
                            error: err,
                            method: 'services.metadataValidateAuthorization',
                        });
                        return next(err);
                    }
                    return next(null, bucket, config);
                });
        },
        function waterfall3(bucket, config, next) {
            // do I need to check bucket flags for deleted / transient like
            // bucketPutACL does?
            log.trace('updating bucket website configuration in metadata');
            // console.log('=== final website config obj', config);
            bucket.setWebsiteConfiguration(config);
            metadata.updateBucket(bucketName, bucket, log, next);
        },
    ], err => {
        if (err) {
            log.trace('error processing request', { error: err,
                method: 'bucketPutWebsite' });
        }
        return callback(err);
    });
}
