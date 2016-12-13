import assert from 'assert';

import withV4 from '../support/withV4';
import BucketUtility from '../../lib/utility/bucket-util';
import { WebsiteConfigTester } from '../../lib/utility/website-util';

const bucketName = 'testdeletewebsitebucket';

describe('DELETE bucket website', () => {
    withV4(sigCfg => {
        const bucketUtil = new BucketUtility('default', sigCfg);
        const s3 = bucketUtil.s3;

        beforeEach(() => s3.createBucketAsync({ Bucket: bucketName }));

        afterEach(() => bucketUtil.deleteOne(bucketName));

        describe('without existing configuration', () => {
            it('should return a 200 response', done => {
                s3.deleteBucketWebsite({ Bucket: bucketName }, err => {
                    assert.strictEqual(err, null,
                        `Found unexpected err ${err}`);
                    done();
                });
            });
        });

        describe('with existing configuration', () => {
            beforeEach(done => {
                const config = new WebsiteConfigTester('index.html');
                process.stdout.write('about to put bucket website\n');
                s3.putBucketWebsite({ Bucket: bucketName,
                WebsiteConfiguration: config }, done);
            });

            it('should delete bucket configuration successfully', done => {
                s3.deleteBucketWebsite({ Bucket: bucketName }, err => {
                    assert.strictEqual(err, null,
                        `Found unexpected err ${err}`);
                    return done();
                });
            });
        });
    });
});
