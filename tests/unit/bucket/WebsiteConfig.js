import assert from 'assert';
import {
    WebsiteConfiguration,
    RoutingRule,
} from '../../../lib/metadata/WebsiteConfig';

const testRoutingRuleParams = {
    redirect: {
        protocol: 'http',
        hostName: 'test',
        replaceKeyPrefixWith: '/docs',
        replaceKeyWith: 'cat',
        httpRedirectCode: '303',
    },
    condition: {
        keyPrefixEquals: '/documents',
        httpErrorCodeReturnedEquals: '404',
    },
};

describe('RoutingRule class', () => {
    it('should initialize even if no parameters are provided', done => {
        const routingRule = new RoutingRule();
        // assert undefineds?
        done();
    });

    it('should return a new routing rule', done => {
        const routingRule = new RoutingRule(testRoutingRuleParams);
        assert.deepStrictEqual(routingRule._redirect,
            testRoutingRuleParams.redirect);
        assert.deepStrictEqual(routingRule._condition,
            testRoutingRuleParams.condition);
        done();
    });

    it('getRedirect should fetch the instance\'s redirect', done => {
        const routingRule = new RoutingRule(testRoutingRuleParams);
        assert.deepStrictEqual(routingRule.getRedirect(),
            testRoutingRuleParams.redirect);
        done();
    });

    it('getCondition should fetch the instance\'s condition', done => {
        const routingRule = new RoutingRule(testRoutingRuleParams);
        assert.deepStrictEqual(routingRule.getCondition(),
            testRoutingRuleParams.condition);
        done();
    });
});
