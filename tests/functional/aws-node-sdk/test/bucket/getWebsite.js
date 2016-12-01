import assert from 'assert';

import withV4 from '../support/withV4';
import BucketUtility from '../../lib/utility/bucket-util';

const bucketName = 'testgetwebsitebucket';

class _makeWebsiteConfig {
    constructor(indexDocument, errorDocument, redirectAllReqTo) {
        if (indexDocument) {
            this.IndexDocument = {};
            this.IndexDocument.Suffix = indexDocument;
        }
        if (errorDocument) {
            this.ErrorDocument = {};
            this.ErrorDocument.Key = errorDocument;
        }
        if (redirectAllReqTo) {
            this.RedirectAllRequestsTo = redirectAllReqTo;
        }
    }
    addRoutingRule(redirectParams, conditionParams) {
        const newRule = {};
        if (!this.RoutingRules) {
            this.RoutingRules = [];
        }
        if (redirectParams) {
            newRule.Redirect = {};
            Object.keys(redirectParams).forEach(key => {
                newRule.Redirect[key] = redirectParams[key];
            });
        }
        if (conditionParams) {
            newRule.Condition = {};
            Object.keys(conditionParams).forEach(key => {
                newRule.Condition[key] = conditionParams[key];
            });
        }
        this.RoutingRules.push(newRule);
    }
}

describe('GET bucket website', () => {
    withV4(sigCfg => {
        const bucketUtil = new BucketUtility('default', sigCfg);
        const s3 = bucketUtil.s3;

        beforeEach(done => {
            const config = new _makeWebsiteConfig('index.html');

            process.stdout.write('about to create bucket\n');
            s3.createBucket({ Bucket: bucketName }, err => {
                if (err) {
                    process.stdout.write('error in beforeEach', err);
                    done(err);
                }
                process.stdout.write('about to put bucket website\n');
                s3.putBucketWebsite({ Bucket: bucketName,
                    WebsiteConfiguration: config }, err => {
                    if (err) {
                        process.stdout.write('error in beforeEach', err);
                        done(err);
                    }
                    done();
                });
            });
        });

        afterEach(() => {
            process.stdout.write('about to empty bucket\n');
            return bucketUtil.empty(bucketName).then(() => {
                process.stdout.write('about to delete bucket\n');
                return bucketUtil.deleteOne(bucketName);
            }).catch(err => {
                if (err) {
                    process.stdout.write('error in afterEach', err);
                    throw err;
                }
            });
        });

        it('should get a bucket website successfully', done => {
            s3.getBucketWebsite({ Bucket: bucketName }, (err, res) => {
                console.log(res);
                assert.strictEqual(err, null, `Found unexpected err ${err}`);
                done();
            });
        });
    });
});
