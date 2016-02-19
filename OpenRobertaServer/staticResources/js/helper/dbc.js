define([ 'require', 'exports', 'log' ], function(require, exports) {

    var LOG = require('log');

    /**
     * assertEq: assert that two objects are === w.r.t. to type and content,
     * otherwise LOG and throw an exception
     * 
     * @memberof DBC
     */
    function assertEq(expected, given) {
        function internalCheck(expected, given) {
            if (typeof (expected) === typeof (given)) {
                if (expected === given) {
                    return null;
                } else {
                    return 'Violation. Expected value: ' + expected + ', given: ' + given;
                }
            } else {
                return 'Violation. Expected type: ' + typeof (expected) + ', given: ' + typeof (given);
            }
        }
        var msg = internalCheck(expected, given);
        if (msg !== null) {
            LOG.info(msg);
            throw msg;
        }
    }

    exports.assertEq = assertEq;

    /**
     * assertTrue: assert that a condition holds, otherwise LOG and throw an
     * exception
     * 
     * @memberof DBC
     */
    function assertTrue(boolToTest, msg) {
        if (!boolToTest) {
            LOG.info(msg);
            throw msg;
        }
    }

    exports.assertTrue = assertTrue;
});
