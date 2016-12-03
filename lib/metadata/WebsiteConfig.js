export class RoutingRule {
    /**
    * Represents a routing rule in a website configuration.
    * @constructor
    * @param {object} params - object containing redirect and condition objects
    */
    constructor(params) {
        if (params && params.redirect) {
            this.setRedirect(params.redirect);
        }
        if (params && params.condition) {
            this.setCondition(params.condition);
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

export class WebsiteConfiguration {
    /**
    * Represents website configuration.
    * @constructor
    * @param {object} params - object containing parameters
    * @param {string} params.indexDocument - key for index document object
    * @param {string} params.errorDocument - key for error document object
    * @param {object} params.redirectAllRequestsTo - object containing info
    * about how to redirect all requests
    * @param {string} params.redirectAllRequestsTo.hostName - hostName to use
    * when redirecting all requests
    * @param {string} params.redirectAllRequestsTo.protocol - protocol to use
    * when redirecting all requests ('http' or 'https')
    * @param {RoutingRule[]} params.routingRules - array of Routing Rule
    * instances
    */
    constructor(params) {
        if (params) {
            this._indexDocument = params.indexDocument;
            this._errorDocument = params.errorDocument;
            this._redirectAllRequestsTo = params.redirectAllRequestsTo;

            if (params.routingRules) {
                this._routingRules = params.routingRules.map(rule => {
                    if (rule instanceof RoutingRule) {
                        return rule;
                    }
                    return new RoutingRule(rule);
                });
            }
        }
    }

    /**
    * Set the redirectAllRequestsTo
    * @param {object} obj - object to set as redirectAllRequestsTo
    * @return {undefined};
    */
    setRedirectAllRequestsTo(obj) {
        const { hostName, protocol } = obj;
        this._redirectAllRequestsTo = { hostName, protocol };
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
     * Add a RoutingRule instance to routingRules array
     * @param {object} obj - rule to add to array
     * @return {undefined};
     */
    addRoutingRule(obj) {
        if (!this._routingRules) {
            this._routingRules = [];
        }
        if (obj instanceof RoutingRule) {
            this._routingRules.push(obj);
        } else {
            this._routingRules.push(new RoutingRule(obj));
        }
    }

    /**
     * Get routing rules
     * @return {RoutingRule[]} - array of RoutingRule instances
     */
    getRoutingRules() {
        return this._routingRules;
    }

}
