import assert from 'assert';

import withV4 from '../support/withV4';
import BucketUtility from '../../lib/utility/bucket-util';
import { WebsiteConfigTester } from '../../lib/utility/website-util';

const bucketName = 'testgetwebsitebucket';

describe('GET bucket website', () => {
    withV4(sigCfg => {
        const bucketUtil = new BucketUtility('default', sigCfg);
        const s3 = bucketUtil.s3;

        afterEach(() => {
            process.stdout.write('about to delete bucket\n');
            return bucketUtil.deleteOne(bucketName)
            .catch(err => {
                if (err) {
                    process.stdout.write('error in afterEach', err);
                    throw err;
                }
            });
        });

        describe('with existing bucket configuration', () => {
            before(done => {
                const config = new WebsiteConfigTester('index.html');
                process.stdout.write('about to create bucket\n');
                s3.createBucket({ Bucket: bucketName }, err => {
                    if (err) {
                        process.stdout.write('error creating bucket', err);
                        return done(err);
                    }
                    process.stdout.write('about to put bucket website\n');
                    s3.putBucketWebsite({ Bucket: bucketName,
                        WebsiteConfiguration: config }, err => {
                        if (err) {
                            process.stdout.write('error putting bucket website',
                                err);
                            return done(err);
                        }
                        return done();
                    });
                    return undefined;
                });
            });

            it('should return bucket website xml successfully', done => {
                s3.getBucketWebsite({ Bucket: bucketName }, err => {
                    assert.strictEqual(err, null,
                        `Found unexpected err ${err}`);
                    return done();
                });
            });
        });

        describe('on bucket without website configuration', () => {
            before(done => {
                process.stdout.write('about to create bucket\n');
                s3.createBucket({ Bucket: bucketName }, err => {
                    if (err) {
                        process.stdout.write('error creating bucket', err);
                        return done(err);
                    }
                    return done();
                });
            });

            it('should return NoSuchWebsiteConfiguration', done => {
                s3.getBucketWebsite({ Bucket: bucketName }, err => {
                    assert(err);
                    assert.strictEqual(err.code, 'NoSuchWebsiteConfiguration');
                    assert.strictEqual(err.statusCode, 404);
                    return done();
                });
            });
        });
    });
});
