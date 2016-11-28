import { parseString } from 'xml2js';

import { errors } from 'arsenal';

/*
   Format of xml request:

   <WebsiteConfiguration xmlns='http://s3.amazonaws.com/doc/2006-03-01/'>
     <IndexDocument>
       <Suffix>index.html</Suffix>
     </IndexDocument>
     <ErrorDocument>
       <Key>Error.html</Key>
     </ErrorDocument>

     <RoutingRules>
       <RoutingRule>
       <Condition>
         <KeyPrefixEquals>docs/</KeyPrefixEquals>
       </Condition>
       <Redirect>
         <ReplaceKeyPrefixWith>documents/</ReplaceKeyPrefixWith>
       </Redirect>
       </RoutingRule>
       ...
    </RoutingRules>
   </WebsiteConfiguration>
   */


/** Check if parsed xml element contains a specified child element
* @param {obj} obj - represents xml element to check for child element
* @param {string} requiredElem - name of child element
* @param {boolean} isList - indicates if obj is list of children elements
* @return {boolean} true / false - if parsed xml element contains child
*/
function _xmlContainsElem(obj, requiredElem, isList) {
    if (!Array.isArray(obj)
    || obj.length !== 1
    || !Array.isArray(obj[0][requiredElem])) {
        return false;
    }
    if (!isList) {
        if (obj[0][requiredElem].length !== 1) {
            return false;
        }
    } else if (obj[0][requiredElem].length === 0) {
        return false;
    }

    return true;
}

/** Validate XML; on success, pass object representing website configuration
* to callback, otherwise pass error
* @param {obj} jsonResult - website configuration xml parsed into JSON
* @param {string} xml - xml from putBucketWebsite request body
* @param {logger} log - logger object
* @param {callback} cb - callback
* @return {undefined} and calls callback
*/
function _validateWebsiteConfigXml(jsonResult, xml, log, cb) {
    const websiteConfiguration = {};
    let errMsg;

    console.log('===== jsonResult', JSON.stringify(jsonResult, null, 4));

    function _validateStringNotEmpty(value, elem, errType, customErrMsg) {
        errMsg = customErrMsg || `${elem} is not well-formed`;
        if (typeof value !== 'string' || value === '') {
            log.debug(errMsg, { xml });
            return cb(errors[errType].customizeDescription(errMsg));
        }
        return undefined;
    }

    function _validateProtocolValue(value) {
        if (value !== 'http' && value !== 'https') {
            errMsg = 'Invalid protocol, protocol can be http or https. ' +
            'If not defined the protocol will be selected automatically.';
            log.debug(errMsg, { xml });
            return cb(errors.InvalidRequest.customizeDescription(errMsg));
        }
        return undefined;
    }

    if (!jsonResult || !jsonResult.WebsiteConfiguration) {
        errMsg = 'Invalid website configuration xml';
        log.debug(errMsg, { xml });
        return cb(errors.MalformedXML.customizeDescription(errMsg));
    }

    const resultConfig = jsonResult.WebsiteConfiguration;
    if (!resultConfig.IndexDocument && !resultConfig.RedirectAllRequestsTo) {
        errMsg = 'Value for IndexDocument Suffix must be provided if ' +
        'RedirectAllRequestsTo is empty';
        log.debug(errMsg, { xml });
        return cb(errors.InvalidArgument.customizeDescription(errMsg));
    }

    if (resultConfig.RedirectAllRequestsTo) {
        const parent = resultConfig.RedirectAllRequestsTo;
        if (resultConfig.IndexDocument || resultConfig.ErrorDocument ||
        resultConfig.RoutingRules) {
            errMsg = 'RedirectAllRequestsTo cannot be provided in ' +
            'conjunction with other Routing Rules.';
            log.debug(errMsg, { xml });
            return cb(errors.InvalidRequest.customizeDescription(errMsg));
        }
        if (!_xmlContainsElem(parent, 'HostName')) {
            errMsg = 'RedirectAllRequestsTo not well-formed';
            log.debug(errMsg, { xml });
            return cb(errors.MalformedXML.customizeDescription(errMsg));
        }
        _validateStringNotEmpty(parent[0].HostName[0], 'HostName',
        'InvalidRequest', 'Valid HostName required in RedirectAllRequestsTo');
        websiteConfiguration.redirectAllRequestsTo =
            { hostName: parent[0].HostName[0] };
        if (_xmlContainsElem(parent, 'Protocol')) {
            _validateProtocolValue(parent[0].Protocol[0]);
            websiteConfiguration.redirectAllRequestsTo.protocol =
                parent[0].Protocol[0];
        }
    }

    if (resultConfig.IndexDocument) {
        const parent = resultConfig.IndexDocument;
        if (!_xmlContainsElem(parent, 'Suffix')) {
            errMsg = 'IndexDocument is not well-formed';
            log.debug(errMsg, { xml });
            return cb(errors.MalformedXML.customizeDescription(errMsg));
        } else if (typeof parent[0].Suffix[0] !== 'string'
        || parent[0].Suffix[0] === ''
        || parent[0].Suffix[0].indexOf('/') !== -1) {
            errMsg = 'IndexDocument Suffix is not well-formed';
            log.debug(errMsg, { xml });
            return cb(errors.InvalidArgument.customizeDescription(errMsg));
        }
        websiteConfiguration.indexDocument = parent[0].Suffix[0];
    }

    if (resultConfig.ErrorDocument) {
        const parent = resultConfig.ErrorDocument;
        if (!_xmlContainsElem(parent, 'Key')) {
            errMsg = 'ErrorDocument is not well-formed';
            log.debug(errMsg, { xml });
            return cb(errors.MalformedXML.customizeDescription(errMsg));
        }
        _validateStringNotEmpty(parent[0].Key[0], 'ErrorDocument Key',
        'InvalidArgument');
        websiteConfiguration.errorDocument = parent[0].Key[0];
    }

    if (resultConfig.RoutingRules) {
        websiteConfiguration.routingRules = [];
        const parent = resultConfig.RoutingRules;
        if (!_xmlContainsElem(parent, 'RoutingRule', true)) {
            errMsg = 'RoutingRules is not well-formed';
            log.debug(errMsg, { xml });
            return cb(errors.MalformedXML.customizeDescription(errMsg));
        }
        for (let i = 0; i < parent[0].RoutingRule.length; i++) {
            const rule = parent[0].RoutingRule[i];
            const ruleObj = { redirect: {} };
            if (!(Array.isArray(rule.Redirect) && rule.Redirect.length === 1)) {
                errMsg = 'RoutingRule requires Redirect, which is ' +
                'missing or not well-formed';
                log.debug(errMsg, { xml });
                return cb(errors.MalformedXML.customizeDescription(errMsg));
            }
            // looks like AWS doesn't actually make this check:
            if (!(_xmlContainsElem(rule.Redirect, 'Protocol')
            || _xmlContainsElem(rule.Redirect, 'HostName')
            || _xmlContainsElem(rule.Redirect, 'ReplaceKeyPrefixWith')
            || _xmlContainsElem(rule.Redirect, 'ReplaceKeyWith')
            || _xmlContainsElem(rule.Redirect, 'HttpRedirectCode'))) {
                errMsg = 'Redirect must contain at least one of ' +
                'following: Protocol, HostName, ReplaceKeyPrefixWith, ' +
                'ReplaceKeyWith, or HttpRedirectCode element';
                log.debug(errMsg, { xml });
                return cb(errors.MalformedXML.customizeDescription(errMsg));
            }
            if (rule.Redirect[0].Protocol) {
                _validateProtocolValue(rule.Redirect[0].Protocol[0]);
                ruleObj.redirect.protocol = rule.Redirect[0].Protocol[0];
            }
            if (rule.Redirect[0].HttpRedirectCode) {
                const code = parseInt(rule.Redirect[0].HttpRedirectCode[0], 10);
                if (isNaN(code)) {
                    errMsg = 'The provided HTTP redirect code is not valid. ' +
                    'It should be a string containing a number.';
                    log.debug(errMsg, { xml });
                    return cb(errors.MalformedXML
                        .customizeDescription(errMsg));
                }
                if (!(code > 300 && code < 400)) {
                    errMsg = `The provided HTTP redirect code (${code}) is ` +
                    'not valid. Valid codes are 3XX except 300';
                    log.debug(errMsg, { xml });
                    return cb(errors.InvalidRequest
                        .customizeDescription(errMsg));
                }
                ruleObj.redirect.httpRedirectCode = code;
            }
            const valuesToCheck = ['HostName', 'ReplaceKeyPrefixWith',
            'ReplaceKeyWith'];
            for (let j = 0; j < valuesToCheck.length; j++) {
                const elem = valuesToCheck[j];
                if (rule.Redirect[0][`${elem}`]) {
                    const value = rule.Redirect[0][`${elem}`][0];
                    _validateStringNotEmpty(value, elem, 'InvalidArgument');
                    const objKey = elem.charAt(0).toLowerCase() + elem.slice(1);
                    ruleObj.redirect[`${objKey}`] = value;
                }
            }
            if (_xmlContainsElem(rule.Redirect, 'ReplaceKeyPrefixWith')
            && _xmlContainsElem(rule.Redirect, 'ReplaceKeyWith')) {
                errMsg = 'Redirect must not contain both ReplaceKeyWith ' +
                'and ReplaceKeyPrefixWith';
                log.debug(errMsg, { xml });
                return cb(errors.InvalidRequest.customizeDescription(errMsg));
            }
            if (Array.isArray(rule.Condition) && rule.Condition.length === 1) {
                ruleObj.condition = {};
                if (!_xmlContainsElem(rule.Condition, 'KeyPrefixEquals') &&
                !_xmlContainsElem(rule.Condition,
                'HttpErrorCodeReturnedEquals')) {
                    errMsg = 'Condition is not well-formed. ' +
                    'Condition should contain valid KeyPrefixEquals or ' +
                    'HttpErrorCodeReturnEquals element.';
                    log.debug(errMsg, { xml });
                    return cb(errors.InvalidRequest
                        .customizeDescription(errMsg));
                }
                if (rule.Condition[0].KeyPrefixEquals) {
                    const value = rule.Condition[0].KeyPrefixEquals[0];
                    _validateStringNotEmpty(value, 'KeyPrefixEquals',
                    'InvalidArgument');
                    ruleObj.condition.keyPrefixEquals = value;
                }
                if (rule.Condition[0].HttpErrorCodeReturnedEquals) {
                    const code = parseInt(rule.Condition[0]
                        .HttpErrorCodeReturnedEquals[0], 10);
                    if (isNaN(code)) {
                        errMsg = 'The provided HTTP error code is not valid. ' +
                        'It should be a string containing a number.';
                        log.debug(errMsg, { xml });
                        return cb(errors.MalformedXML
                            .customizeDescription(errMsg));
                    }
                    if (!(code > 399 && code < 600)) {
                        errMsg = `The provided HTTP error code (${code}) is ` +
                        'not valid. Valid codes are 4XX or 5XX.';
                        log.debug(errMsg, { xml });
                        return cb(errors.InvalidRequest
                            .customizeDescription(errMsg));
                    }
                    ruleObj.condition.httpErrorCodeReturnedEquals = code;
                }
            }
            websiteConfiguration.routingRules.push(ruleObj);
        }
    }
    return cb(null, websiteConfiguration);
}

export function parseWebsiteConfigXml(xml, log, next) {
    parseString(xml, (err, result) => {
        if (err) {
            log.trace('xml parsing failed', {
                error: err,
                method: 'parseWebsiteConfigXml',
            });
            log.debug('invalid xml', { xmlObj: xml });
            return next(errors.MalformedXML);
        }
        console.log('===== xml', xml);
        // console.log('===== parseString res', JSON.stringify(result, null, 4));

        _validateWebsiteConfigXml(result, xml, log, (err, config) => {
            if (err) {
                log.trace('xml validation failed', {
                    error: err,
                    method: '_validateWebsiteConfigXml',
                });
                return next(err);
            }
            log.trace('website configuration', { config });
            return next(null, config);
        });
        return undefined;
    });
}
