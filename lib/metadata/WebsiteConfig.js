export class RoutingRule {
    /**
    * Represents a routing rule in a website configuration.
    * @constructor
    * @param {object} params - object containing redirect and condition objects
    */
    constructor(params) {
//        const redirect = params ? params.redirect : undefined;
//        const condition = params ? params.condition : undefined;
// why do I initialize everything to undefined anyway? not really sure the pt..
        if (params && params.redirect) {
            this.setRedirect(params.redirect);
        } else {
            this._redirect = {
                protocol: undefined,
                hostName: undefined,
                replaceKeyPrefixWith: undefined,
                replaceKeyWith: undefined,
                httpRedirectCode: undefined,
            };
        }

        if (params && params.condition) {
            this.setCondition(params.condition);
        } else {
            this._condition = {
                keyPrefixEquals: undefined,
                httpErrorCodeReturnedEquals: undefined,
            };
        }
    }
    /**
    * Set the condition object
    * @param {object} obj - object to set as condition
    * @return {undefined};
    */
    setCondition(obj) {
        const { keyPrefixEquals, httpErrorCodeReturnedEquals } = obj;
        this._condition = { keyPrefixEquals, httpErrorCodeReturnedEquals };
    }

    /**
    * Return the condition object
    * @return {object} condition;
    */
    getCondition() {
        return this._condition;
    }

    /**
    * Set the redirect object
    * @param {object} obj - object to set as redirect
    * @return {undefined};
    */
    setRedirect(obj) {
        const {
            protocol,
            hostName,
            replaceKeyPrefixWith,
            replaceKeyWith,
            httpRedirectCode,
        } = obj;
        this._redirect = {
            protocol,
            hostName,
            replaceKeyPrefixWith,
            replaceKeyWith,
            httpRedirectCode,
        };
    }

    /**
    * Return the redirect object
    * @return {object} redirect;
    */
    getRedirect() {
        return this._redirect;
    }
}

export class WebsiteConfig {
    /**
    * Represents website configuration.
    * @constructor
    * @param {string} indexDocument - key for index document object
    * @param {string} errorDocument - key for error document object
    * @param {object} redirectAllRequestsTo - object containing info about
    * how to redirect all requests
    * @param {string} redirectAllRequestsTo.hostName - hostName to use when
    * redirecting all requests
    * @param {string} redirectAllRequestsTo.protocol - protocol to use when
    * redirecting all requests ('http' or 'https')
    * @param {RoutingRule[]} routingRules - array of Routing Rule instances
    */
    constructor(indexDocument, errorDocument, redirectAllRequestsTo,
        routingRules) {
        this._indexDocument = indexDocument;
        this._errorDocument = errorDocument;
        this._redirectAllRequestsTo = redirectAllRequestsTo || {
            hostName: undefined,
            protocol: undefined,
        };
        this._routingRules = routingRules || [];
    }

    /**
    * Serialize the object
    * @return {string} - stringified object
    */
    serialize() {
        return JSON.stringify(this); // test this eventually
    }

    /**
     * deSerialize the JSON string
     * @param {string} stringConfig - the stringified config
     * @return {object} - parsed string
     */
     // ughhh.. gotta test this :C
    static deSerialize(stringBucket) {
        const obj = JSON.parse(stringBucket);
        let routingRules = null;
        if (obj.routingRules) {
            routingRules = obj.routingRules.map(rule => new RoutingRule(rule));
        }
        return new WebsiteConfig(obj.indexDocument, obj.errorDocument,
            obj.redirectAllRequestsTo, routingRules);
    }

    /**
    * Set the redirectAllRequestsTo
    * @param {object} obj - object to set as redirectAllRequestsTo
    * @return {undefined};
    */
    setRedirectAllRequestsTo(obj) {
        const { hostName, protocol } = obj;
        this._redirectAllRequestsTo.hostName = hostName;
        this._redirectAllRequestsTo.protocol = protocol;
    }

    /**
    * Return the redirectAllRequestsTo object
    * @return {object} redirectAllRequestsTo;
    */
    getRedirectAllRequestsTo() {
        return this._redirectAllRequestsTo;
    }

    /**
    * Set the index document object name
    * @param {string} suffix - index document object key
    * @return {undefined};
    */
    setIndexDocument(suffix) {
        this._indexDocument = suffix;
    }

    /**
     * Get the index document object name
     * @return {string} indexDocument
     */
    getIndexDocument() {
        return this._indexDocument;
    }

    /**
     * Set the error document object name
     * @param {string} key - error document object key
     * @return {undefined};
     */
    setErrorDocument(key) {
        this._errorDocument = key;
    }

    /**
     * Get the error document object name
     * @return {string} errorDocument
     */
    getErrorDocument() {
        return this._errorDocument;
    }

    /**
     * Add a routingRule instance to routingRules Array
     * @param {RoutingRule} - instance of RoutingRule
     */
    addRoutingRule(routingRule) {
        this._routingRules.push(routingRule);
    }

    /**
     * Get routing rules
     * @return {RoutingRule[]} - array of RoutingRule instances
     */
    getRoutingRule() {
        return this._routingRules;
    }

}
