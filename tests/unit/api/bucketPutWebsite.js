import { errors } from 'arsenal';
import assert from 'assert';

import bucketPut from '../../../lib/api/bucketPut';
import bucketPutWebsite from '../../../lib/api/bucketPutWebsite';
import { cleanup,
    DummyRequestLogger,
    makeAuthInfo,
    WebsiteConfig }
from '../helpers';
import metadata from '../../../lib/metadata/wrapper';

const log = new DummyRequestLogger();
const authInfo = makeAuthInfo('accessKey1');
const bucketName = 'bucketname';
// try commenting out namespace later after testing to see if it is necessary
const namespace = 'default';
const locationConstraint = 'us-west-1';
const testBucketPutRequest = {
    bucketName,
    namespace,
    headers: { host: `${bucketName}.s3.amazonaws.com` },
    url: '/',
};

function _getPutWebsiteRequest(xml) {
    const request = {
        bucketName,
        namespace,
        headers: {
            host: `${bucketName}.s3.amazonaws.com`,
        },
        url: '/?website',
        query: { website: '' },
    };
    request.post = xml;
    return request;
}

describe('putBucketWebsite API', () => {
    before(() => cleanup());
    beforeEach(done => bucketPut(authInfo, testBucketPutRequest,
        locationConstraint, log, done));
    afterEach(() => cleanup());

    it('should update a bucket\'s metadata with website config obj', done => {
        const config = new WebsiteConfig('index.html', 'error.html');
        config.addRoutingRule({ ReplaceKeyPrefixWith: 'documents/' },
        { KeyPrefixEquals: 'docs/' });
        const testBucketPutWebsiteRequest =
            _getPutWebsiteRequest(config.getXml());
        bucketPutWebsite(authInfo, testBucketPutWebsiteRequest, log, err => {
            if (err) {
                process.stdout.write(`Err putting website config ${err}`);
                return done(err);
            }
            return metadata.getBucket(bucketName, log, (err, bucket) => {
                if (err) {
                    process.stdout.write(`Err retrieving bucket MD ${err}`);
                    return done(err);
                }
                const bucketWebsiteConfig = bucket.getWebsiteConfiguration();
                assert.strictEqual(bucketWebsiteConfig.indexDocument,
                    config.IndexDocument.Suffix);
                assert.strictEqual(bucketWebsiteConfig.errorDocument,
                    config.ErrorDocument.Key);
                assert.strictEqual(bucketWebsiteConfig.routingRules[0]
                    .condition.keyPrefixEquals,
                    config.RoutingRules[0].Condition.KeyPrefixEquals);
                assert.strictEqual(bucketWebsiteConfig.routingRules[0]
                    .redirect.replaceKeyPrefixWith,
                    config.RoutingRules[0].Redirect.ReplaceKeyPrefixWith);
                return done();
            });
        });
    });
});
// make a dummy request
// call bucketPutWebsite with dummy request
// call bucketMD to retrieve config from MD, confirm it was uploaded
