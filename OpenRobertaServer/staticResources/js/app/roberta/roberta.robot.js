define([ 'exports', 'util', 'log', 'message', 'roberta.brick-configuration', 'roberta.user-state', 'roberta.toolbox', 'rest.robot', 'roberta.program',
        'jquery', 'jquery-validate' ], function(exports, UTIL, LOG, MSG, ROBERTA_BRICK_CONFIGURATION, userState, ROBERTA_TOOLBOX, ROBOT, ROBERTA_PROGRAM, $) {

    var $formSingleModal;

    /**
     * Set token
     *
     * @param {token}
     *            Token value to be set
     */
    function setToken(token) {
        $formSingleModal.validate();
        if ($formSingleModal.valid()) {
            ROBOT.setToken(token, function(result) {
                if (result.rc === "ok") {
                    userState.token = token;
                }
                MSG.displayInformation(result, "MESSAGE_ROBOT_CONNECTED", result.message, userState.robotName);
                setState(result);
                handleFirmwareConflict();
            });
        }
    }

    function initRobotForms() {
        $('#iconDisplayRobotState').onWrap('click', function() {
            showRobotInfo();
        }, 'icon robot click');

        $('#doUpdateFirmware').onWrap('click', function() {
            $('#set-token').modal('hide');
            $('#confirmUpdateFirmware').modal('hide');
            updateFirmware();
        }, 'update firmware of robot');

        $formSingleModal = $('#single-modal-form');
    }
    exports.initRobotForms = initRobotForms;

    function showSetTokenModal() {
        UTIL.showSingleModal(function() {
            $('#singleModalInput').attr('type', 'text');
            $('#single-modal h3').text(Blockly.Msg["MENU_CONNECT"]);
            $('#single-modal label').text(Blockly.Msg["POPUP_VALUE"]);
            // we put the last token back to allow easy reconnect
            $('#singleModalInput').addClass('capitalLetters').val(userState.token);
        }, function() {
            setToken($('#singleModalInput').val().toUpperCase());
        }, function() {
            $('#singleModalInput').removeClass('capitalLetters');
        }, {
            rules : {
                singleModalInput : {
                    required : true,
                    minlength : 8,
                    maxlength : 8
                }
            },
            errorClass : "form-invalid",
            errorPlacement : function(label, element) {
                label.insertAfter(element);
            },
            messages : {
                singleModalInput : {
                    required : Blockly.Msg["VALIDATION_FIELD_REQUIRED"],
                    minlength : Blockly.Msg["VALIDATION_TOKEN_LENGTH"],
                    maxlength : Blockly.Msg["VALIDATION_TOKEN_LENGTH"]
                }
            }
        });
    }
    exports.showSetTokenModal = showSetTokenModal;

    /**
     * Show robot info
     */
    function showRobotInfo() {
        if (userState.robotWait) {
            $("#robotName").text(userState.robotName);
            $("#robotSystem").text(userState.robotFWName);
            if (userState.robotState === "wait") {
                $("#robotStateWait").css('display', 'inline');
                $("#robotStateDisconnected").css('display', 'none');
                $("#robotStateBusy").css('display', 'none');
            } else if (userState.robotState === "busy") {
                $("#robotStateWait").css('display', 'none');
                $("#robotStateDisconnected").css('display', 'none');
                $("#robotStateBusy").css('display', 'inline');
            } else {
                $("#robotStateWait").css('display', 'none');
                $("#robotStateDisconnected").css('display', 'inline');
                $("#robotStateBusy").css('display', 'none');
            }
            if (userState.language == 'EN') {
                $("#robotBattery").text(userState.robotBattery + ' V');
            } else {
                $("#robotBattery").text(userState.robotBattery.toString().replace(".", ",") + ' V');
            }
            var robotWait = parseInt(userState.robotWait, 10);
            if (robotWait < 1000) {
                $("#robotWait").text(robotWait + ' ms');
            } else {
                $("#robotWait").text(Math.round(robotWait / 1000) + ' s');
            }
            $("#show-robot-info").modal("show");
        } else {
            MSG.displayMessage("ORA_ROBOT_NOT_CONNECTED", "POPUP", "");
        }
    }
    exports.showRobotInfo = showRobotInfo;

    /**
     * Handle firmware conflict between server and robot
     */
    function handleFirmwareConflict() {
        if (userState.robotFWName != "lejos") {
            return false;
        }
        var regex = '(.+\..+)\..+'; // get x.y from version x.y.z
        var mainversionServer = userState.serverVersion.match(regex)[1];
        var mainversionRobot = userState.robotVersion.match(regex)[1];
        if (mainversionServer > mainversionRobot) {
            LOG.info("The firmware version '" + userState.serverVersion + "' on the server is newer than the firmware version '" + userState.robotVersion
                    + "' on the robot");
            $("#confirmUpdateFirmware").modal('show');
            return true;
        } else if (mainversionServer < mainversionRobot) {
            LOG.info("The firmware version '" + userState.serverVersion + "' on the server is older than the firmware version '" + userState.robotVersion
                    + "' on the robot");
            MSG.displayMessage("MESSAGE_FIRMWARE_ERROR", "POPUP", "");
            return true;
        }
        return false;
    }
    exports.handleFirmwareConflict = handleFirmwareConflict;

    /**
     * Update robot firmware
     */
    function updateFirmware() {
        ROBOT.updateFirmware(function(result) {
            setState(result);
            if (result.rc === "ok") {
                MSG.displayMessage("MESSAGE_RESTART_ROBOT", "POPUP", "");
                userState.robotState = 'disconnected';
                userState.robotName = '';
            } else {
                MSG.displayInformation(result, "", result.message, userState.robotFWName);
            }
        });
    }
    exports.updateFirmware = updateFirmware;

    /**
     * Set robot state
     *
     * @param {result}
     *            result of server call
     */
    function setState(result) {
        if (result['version']) {
            userState.version = result.version;
        }
        if (result['server.version']) {
            userState.serverVersion = result['server.version'];
        }
        if (result['robot.version']) {
            userState.robotVersion = result['robot.version'];
        }
        if (result['robot.firmwareName'] != undefined) {
            userState.robotFWName = result['robot.firmwareName'];
        } else {
            userState.robotFWName = '';
        }
        if (result['robot.wait'] != undefined) {
            userState.robotWait = result['robot.wait'];
        } else {
            userState.robotWait = '';
        }
        if (result['robot.battery'] != undefined) {
            userState.robotBattery = result['robot.battery'];
        } else {
            userState.robotBattery = '';
        }
        if (result['robot.name'] != undefined) {
            userState.robotName = result['robot.name'];
        } else {
            userState.robotName = '';
        }
        if (result['robot.state'] != undefined) {
            userState.robotState = result['robot.state'];
        } else {
            userState.robotState = '';
        }
        if (result['robot.sensorvalues'] != undefined) {
            userState.sensorValues = result['robot.sensorvalues'];
        } else {
            userState.sensorValues = '';
        }
        if (result['robot.nepoexitvalue'] != undefined) {
            //TODO: For different robots we have different error messages
            if (result['robot.nepoexitvalue'] !== userState.nepoExitValue) {
                userState.nepoExitValue = result['robot.nepoexitvalue'];
                if (userState.nepoExitValue !== 143 && userState.nepoExitValue !== 0) {
                    MSG.displayMessage('POPUP_PROGRAM_TERMINATED_UNEXPECTED', 'POPUP', '')
                }
            }
        }
        if (userState.accountName) {
            $('#head-navi-icon-user').removeClass('error');
            $('#head-navi-icon-user').addClass('ok');
        } else {
            $('#head-navi-icon-user').removeClass('ok');
            $('#head-navi-icon-user').addClass('error');
        }
        if (userState.robotState === 'wait') {
            $('#iconDisplayRobotState').removeClass('error');
            $('#iconDisplayRobotState').removeClass('busy');
            $('#iconDisplayRobotState').addClass('wait');
            ROBERTA_PROGRAM.getBlocklyWorkspace().robControls.enable('runOnBrick');
            $('#menuRunProg').parent().removeClass('disabled');

        } else if (userState.robotState === 'busy') {
            $('#iconDisplayRobotState').removeClass('wait');
            $('#iconDisplayRobotState').removeClass('error');
            $('#iconDisplayRobotState').addClass('busy');
            $('#menuRunProg').parent().addClass('disabled');
            if (ROBERTA_PROGRAM.getBlocklyWorkspace()) {
                ROBERTA_PROGRAM.getBlocklyWorkspace().robControls.disable('runOnBrick');
            }
        } else {
            $('#iconDisplayRobotState').removeClass('busy');
            $('#iconDisplayRobotState').removeClass('wait');
            $('#iconDisplayRobotState').addClass('error');
            $('#menuRunProg').parent().addClass('disabled');
            if (ROBERTA_PROGRAM.getBlocklyWorkspace()) {
                ROBERTA_PROGRAM.getBlocklyWorkspace().robControls.disable('runOnBrick');
            }
        }
    }
    exports.setState = setState;

    /**
     * Init robot
     */
    function initRobot(result) {
//        ROBOT.setRobot(userState.robot, function(result) {
        UTIL.response(result);
//            if (result.rc === "ok") {
        $('.robotType').removeClass('disabled');
        $('.' + userState.robot).addClass('disabled');
        if (userState.robot != 'ev3') {
            $('#head-navi-icon-robot').removeClass('typcn-Roberta');
            $('#head-navi-icon-robot').addClass('typcn-' + userState.robot);
        }
        $('#blocklyDiv').removeClass('simBackground');
        $('#menuEv3').parent().addClass('disabled');
        $('#menuSim').parent().removeClass('disabled');
        $('#menuConnect').parent().removeClass('disabled');
        $('#iconDisplayRobotState').removeClass('typcn-Roberta');
        $('#iconDisplayRobotState').addClass('typcn-ev3');
        $('#menuShowCode').parent().removeClass('disabled');
    }
//        });
//    }

    exports.initRobot = initRobot;

});
