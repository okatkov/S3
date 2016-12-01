import assert from 'assert';

import bucketPut from '../../../lib/api/bucketPut';
import bucketPutWebsite from '../../../lib/api/bucketPutWebsite';
import bucketGetWebsite from '../../../lib/api/bucketGetWebsite';
import { cleanup,
    DummyRequestLogger,
    makeAuthInfo }
//    WebsiteConfig }
from '../helpers';
// import metadata from '../../../lib/metadata/wrapper';

const log = new DummyRequestLogger();
const authInfo = makeAuthInfo('accessKey1');
const bucketName = 'bucketname';
const locationConstraint = 'us-west-1';
const testBucketPutRequest = {
    bucketName,
    headers: { host: `${bucketName}.s3.amazonaws.com` },
    url: '/',
};

function _makeWebsiteRequest(xml) {
    const request = {
        bucketName,
        headers: {
            host: `${bucketName}.s3.amazonaws.com`,
        },
        url: '/?website',
        query: { website: '' },
    };

    if (xml) {
        request.post = xml;
    }
    return request;
}
const testGetWebsiteRequest = _makeWebsiteRequest();

function _comparePutGetXml(sampleXml, done) {
    const fullXml = '<?xml version="1.0" encoding="UTF-8" ' +
    'standalone="yes"?><WebsiteConfiguration ' +
    'xmlns="http://s3.amazonaws.com/doc/2006-03-01/">' +
    `${sampleXml}</WebsiteConfiguration>`;
    const testPutWebsiteRequest = _makeWebsiteRequest(fullXml);
    bucketPutWebsite(authInfo, testPutWebsiteRequest, log, err => {
        if (err) {
            process.stdout.write(`Err putting website config ${err}`);
            return done(err);
        }
        return bucketGetWebsite(authInfo, testGetWebsiteRequest, log,
        (err, res) => {
            assert.strictEqual(err, null, `Unexpected err ${err}`);
            assert.strictEqual(res, fullXml);
            done();
        });
    });
}

describe.only('getBucketWebsite API', () => {
    before(() => cleanup());
    beforeEach(done => bucketPut(authInfo, testBucketPutRequest,
        locationConstraint, log, done));
    afterEach(() => cleanup());

    it('should return same IndexDocument XML as uploaded', done => {
        const xml =
            '<IndexDocument><Suffix>index.html</Suffix></IndexDocument>';
        _comparePutGetXml(xml, done);
    });
});
