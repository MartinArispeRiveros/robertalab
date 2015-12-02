var bricklyActive = false;
var userState = {};
var toastMessages = [];
var id;

/**
 * Initialize user-state-object
 */
function initUserState() {
    USER.clear(function(result) {
        response(result);
    });
    userState.version = 'xx.xx.xx';
    userState.language = 'DE';
    userState.robot = 'ev3';
    userState.id = -1;
    userState.accountName = '';
    userState.name = '';
    userState.program = 'NEPOprog';
    userState.configuration = 'EV3basis';
    userState.programSaved = false;
    userState.configurationSaved = false;
    userState.programModified = false;
    userState.programShared = false;
    userState.programTimestamp = '';
    userState.configurationModified = false;
    userState.toolbox = 'beginner';
    userState.token = '1A2B3C4D';
    userState.doPing = true;
    userState.robotName = '';
    userState.robotState = '';
    userState.robotBattery = '';
    userState.robotWait = '';
    userState.robotVersion = '';
    userState.serverVersion = '';
    userState.programBlocks = null;
    userState.programBlocksSaved = null;
    userState.bricklyReady = false;
    userState.blocklyReady = false;
    userState.blocklyTranslated = false;
    userState.bricklyTranslated = false;
}

/**
 * Logout user
 */
function logout() {
    USER.logout(function(result) {
        response(result);
        if (result.rc === "ok") {
            initUserState();
            setProgram(userState.program);
            setConfiguration(userState.configuration);
            $('#programNameSave :not(btn)').val('');
            $('#configurationNameSave :not(btn)').val('');
            setHeadNavigationMenuState('logout');
            Blockly.getMainWorkspace().saveButton.disable();
            setRobotState(result);
            $('#tabProgram').click();
            displayInformation(result, "MESSAGE_USER_LOGOUT", result.message);
        }
    });
}

/**
 * Handle firmware conflict between server and robot
 */
function handleFirmwareConflict() {
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
        displayMessage("MESSAGE_FIRMWARE_ERROR", "POPUP", "");
        return true;
    }
    return false;
}

/**
 * Update robot firmware
 */
function updateFirmware() {
    ROBOT.updateFirmware(function(result) {
        setRobotState(result);
        if (result.rc === "ok") {
            displayMessage("MESSAGE_RESTART_ROBOT", "POPUP", "");
            userState.robotState = 'disconnected';
        } else {
            displayInformation(result, "", result.message, userState.robotFirmware);
        }
    });
}

/**
 * Show user info
 */
function showUserInfo() {
    $("#loggedIn").text(userState.name);
    if (userState.id != -1) {
        $("#popup_username").text(Blockly.Msg["POPUP_USERNAME"] + ": ");
    } else {
        $("#popup_username").text(Blockly.Msg["POPUP_USERNAME_LOGOFF"]);
    }
    $("#programName").text(userState.program);
    $("#configurationName").text(userState.configuration);
    if (userState.toolbox === 'beginner') {
        $("#toolbox").text(Blockly.Msg["MENU_BEGINNER"]);
    } else {
        $("#toolbox").text(Blockly.Msg["MENU_EXPERT"]);
    }
    $("#show-state-info").modal("show");
}

/**
 * Show robot info
 */
function showRobotInfo() {
    if (userState.robotName) {
        if (userState.robot === "oraSim") {
            $("#robotName").text("ORSim");
        } else {
            $("#robotName").text(userState.robotName);
        }
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
        displayMessage("ORA_ROBOT_NOT_CONNECTED", "POPUP", "");
    }
}

/**
 * Inject Blockly with initial toolbox
 */
function injectBlockly(toolbox, opt_programBlocks, opt_readOnly) {
    response(toolbox);
    var readOnly = opt_readOnly | false;
    if (toolbox.rc === 'ok') {
        if (!readOnly) {
            $('#blocklyDiv').html('');
            Blockly.inject(document.getElementById('blocklyDiv'), {
                path : '/blockly/',
                toolbox : toolbox.data,
                trashcan : true,
                code : true,
                save : true,
                check : true,
                start : true
            });
        } else {
            $('#blocklyDiv').html('');
            Blockly.inject(document.getElementById('blocklyDiv'), {
                path : '/blockly/',
                toolbox : toolbox.data,
                readOnly : true,
                trashcan : false,
                code : false,
                save : false,
                check : false,
                start : false
            });
        }
        if ($(window).width() < 768 && readOnly) {
            Blockly.getMainWorkspace().clear();
        } else {
            initProgramEnvironment(opt_programBlocks);
            setRobotState(toolbox);
        }
        if (userState.robot === "ev3") {
            $('#menuShowCode').parent().removeClass('disabled');
            Blockly.getMainWorkspace().codeButton.enable();
        } else {
            $('#menuShowCode').parent().addClass('disabled');
            Blockly.getMainWorkspace().codeButton.disable();
        }
    }
}

function initProgramEnvironment(opt_programBlocks) {
    Blockly.getMainWorkspace().clear();
    var x, y;
    if ($(window).width() < 768) {
        x = 25;
        y = 25;
    } else {
        x = 370;
        y = 50;
    }
    var text = "<block_set xmlns='http: // www.w3.org/1999/xhtml'>" + "<instance x='" + x + "' y='" + y + "'>" + "<block type='robControls_start'>"
            + "</block>" + "</instance>" + "</block_set>";
    var program = opt_programBlocks || text;
    var xml = Blockly.Xml.textToDom(program);
    Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);
    userState.blocklyReady = true;
    Blockly.fireUiEvent(window, 'resize');
}

/**
 * Set program name
 * 
 * @param {name}
 *            Name to be set
 */
function setProgram(name, opt_owner) {
    if (name) {
        userState.program = name;
        if (opt_owner) {
            name += ' (<span class="typcn typcn-user progName"></span>' + opt_owner + ')';
        }
        $('#tabProgramName').html(name);
    }
}

/**
 * Set configuration name
 * 
 * @param {name}
 *            Name to be set
 */
function setConfiguration(name) {
    if (name) {
        userState.configuration = name;
        $('#tabConfigurationName').text(name);
    }
}

/**
 * Set token
 * 
 * @param {token}
 *            Token value to be set
 */
function setToken(token) {
    var resToken = token.toUpperCase();
    ROBOT.setToken(resToken, function(result) {
        if (result.rc === "ok") {
            userState.token = resToken;
        }
        displayInformation(result, "MESSAGE_ROBOT_CONNECTED", result.message, userState.robotName);
        setRobotState(result);
        handleFirmwareConflict();
    });
}

/**
 * Handle result of server call
 * 
 * @param {result}
 *            Result-object from server call
 */
function response(result) {
    LOG.info('result from server: ' + UTIL.formatResultLog(result));
    if (result.rc != 'ok') {
        displayMessage(result.message, "POPUP", "");
    }
}

/**
 * Save program with new name to server
 */
function saveAsProgramToServer() {
    var progName = $('#programNameSave').val().trim();
    if (!progName.match(/^[a-zA-Z][a-zA-Z0-9]*$/)) {
        displayMessage("MESSAGE_INVALID_NAME", "POPUP", "");
        return;
    }
    var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
    var xmlText = Blockly.Xml.domToText(xml);
    LOG.info('saveAs program ' + userState.program + ' login: ' + userState.id);
    PROGRAM.saveAsProgramToServer(progName, userState.programTimestamp, xmlText, function(result) {
        response(result);
        if (result.rc === 'ok') {
            setProgram(progName);
            $('#menuSaveProg').parent().removeClass('disabled');
            Blockly.getMainWorkspace().saveButton.enable();
            userState.programSaved = true;
            userState.programModified = false;
            userState.programTimestamp = result.lastChanged;
            displayInformation(result, "MESSAGE_EDIT_SAVE_PROGRAM_AS", result.message, userState.program);
        }
    });
}

/**
 * Save program to server
 */
function saveToServer() {
    if (userState.program) {
        var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
        var xmlText = Blockly.Xml.domToText(xml);
        userState.programSaved = true;
        LOG.info('save program ' + userState.program + ' login: ' + userState.id);
        $('.modal').modal('hide'); // close all opened popups
        PROGRAM.saveProgramToServer(userState.program, userState.programShared, userState.programTimestamp, xmlText, function(result) {
            if (result.rc === 'ok') {
                userState.programModified = false;
                userState.programTimestamp = result.lastChanged;
            }
            displayInformation(result, "MESSAGE_EDIT_SAVE_PROGRAM", result.message, userState.program);
        });
    }
}

/**
 * Save configuration with new name to server
 */
function saveAsConfigurationToServer() {
    var confName = $('#configurationNameSave').val();
    if (!confName.match(/^[a-zA-Z][a-zA-Z0-9]*$/)) {
        displayMessage("MESSAGE_INVALID_NAME", "POPUP", "");
        return;
    }
    setConfiguration(confName);
    $('#menuSaveConfig').parent().removeClass('login');
    $('#menuSaveConfig').parent().removeClass('disabled');
    UTIL.getBricklyFrame('#bricklyFrame').Blockly.getMainWorkspace().saveButton.enable();
    userState.configurationSaved = true;
    $('.modal').modal('hide'); // close all opened popups
    var xmlText = UTIL.getBricklyFrame('#bricklyFrame').getXmlOfConfiguration(userState.configuration);
    LOG.info('save brick configuration ' + userState.configuration);
    CONFIGURATION.saveAsConfigurationToServer(userState.configuration, xmlText, function(result) {
        if (result.rc === 'ok') {
            userState.configurationModified = false;
        }
        displayInformation(result, "MESSAGE_EDIT_SAVE_CONFIGURATION_AS", result.message, userState.configuration);
    });
}

/**
 * Save configuration to server
 */
function saveConfigurationToServer() {
    if (userState.configuration) {
        userState.configurationSaved = true;
        $('.modal').modal('hide'); // close all opened popups
        var xmlText = UTIL.getBricklyFrame('#bricklyFrame').getXmlOfConfiguration(userState.configuration);
        LOG.info('save brick configuration ' + userState.configuration);
        CONFIGURATION.saveConfigurationToServer(userState.configuration, xmlText, function(result) {
            if (result.rc === 'ok') {
                userState.configurationModified = false;
            }
            displayInformation(result, "MESSAGE_EDIT_SAVE_CONFIGURATION", result.message, userState.configuration);
        });
    }
}

/**
 * show the generated source code of program
 */
function showSourceProgram() {
    LOG.info('show the generated Java program for ' + userState.program);
    var xmlProgram = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
    var xmlTextProgram = Blockly.Xml.domToText(xmlProgram);
    var xmlTextConfiguration = UTIL.getBricklyFrame('#bricklyFrame').getXmlOfConfiguration(userState.configuration);
    PROGRAM.showSourceProgram(userState.program, userState.configuration, xmlTextProgram, xmlTextConfiguration, function(result) {
        setRobotState(result);
        if (result.rc == "ok") {
            displayPopupMessage("Ok-kO", result.javaSource);
        } else {
            displayInformation(result, "", result.message, "");
        }
    });
}

/**
 * Run program
 */
function runOnBrick() {
    if (userState.robot === 'ev3') {
        if (userState.robotState === '' || userState.robotState === 'disconnected') {
            displayMessage("POPUP_ROBOT_NOT_CONNECTED", "POPUP", "");
        } else if (userState.robotState === 'busy') {
            displayMessage("POPUP_ROBOT_BUSY", "POPUP", "");
        } else if (handleFirmwareConflict()) {
            $('#buttonCancelFirmwareUpdate').css('display', 'none');
            $('#buttonCancelFirmwareUpdateAndRun').css('display', 'inline');
        } else {
            startProgram();
        }
    } else if (userState.robot === 'oraSim') {
        startProgram();
    }
}

/**
 * Show program code
 */
function showCode() {
    if (userState.robot === 'ev3') {
        LOG.info('show code ' + userState.program + ' signed in: ' + userState.id);
        var xmlProgram = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
        var xmlTextProgram = Blockly.Xml.domToText(xmlProgram);
        var xmlTextConfiguration = UTIL.getBricklyFrame('#bricklyFrame').getXmlOfConfiguration(userState.configuration);
        PROGRAM.showSourceProgram(userState.program, userState.configuration, xmlTextProgram, xmlTextConfiguration, function(result) {
            setRobotState(result);
            $('#blocklyDiv').addClass('codeActive');
            $('#blocklyDiv').parent().bind('transitionend', function() {
                Blockly.fireUiEvent(window, 'resize');
            });
            $('#codeDiv').addClass('codeActive');
            $('.nav > li > ul > .robotType').addClass('disabled');
            $('#head-navigation-program-edit').addClass('disabled');
            $('#head-navigation-program-edit>ul').addClass('hidden');
            UTIL.cacheBlocks();
            COMM.json("/toolbox", {
                "cmd" : "loadT",
                "name" : userState.toolbox,
                "owner" : " "
            }, function(result) {
                injectBlockly(result, userState.programBlocks, true);
            });
            $(".code").removeClass('hide');
            document.getElementById('codeDiv').innerHTML = '<textarea>' + result.javaSource + '</textarea>';
        });
    }
}

/**
 * Start the program on the brick
 */
function startProgram() {
    LOG.info('run ' + userState.program + ' signed in: ' + userState.id);
    var xmlProgram = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
    var xmlTextProgram = Blockly.Xml.domToText(xmlProgram);
    var xmlTextConfiguration = UTIL.getBricklyFrame('#bricklyFrame').getXmlOfConfiguration(userState.configuration);
    if (Blockly.hasStartButton) {
        Blockly.getMainWorkspace().startButton.disable();
    }
    PROGRAM.runOnBrick(userState.program, userState.configuration, xmlTextProgram, xmlTextConfiguration, function(result) {
        //PROGRAM.showSourceProgram(userState.program, userState.configuration, xmlTextProgram, xmlTextConfiguration, function(result) {
        // console.log(result.javaSource);
        setRobotState(result);
        if (result.rc == "ok") {
            if (userState.robot === 'oraSim') {
                SIM.init(result.javaScriptProgram);
                $('#blocklyDiv').addClass('simActive');
                $('#blocklyDiv').parent().bind('transitionend', function() {
                    Blockly.fireUiEvent(window, 'resize');
                    setTimeout(function() {
                        SIM.setPause(false);
                    }, 1000);
                });
                $('#simDiv').addClass('simActive');
                $('#simButtonsCollapse').collapse({
                    'toggle' : false
                });
                $('.nav > li > ul > .robotType').addClass('disabled');
                $('#head-navigation-program-edit').addClass('disabled');
                $('#head-navigation-program-edit>ul').addClass('hidden');
                UTIL.cacheBlocks();
                COMM.json("/toolbox", {
                    "cmd" : "loadT",
                    "name" : userState.toolbox,
                    "owner" : " "
                }, function(result) {
                    injectBlockly(result, userState.programBlocks, true);
                });
                $(".sim").removeClass('hide');
            } else {
                displayMessage("MESSAGE_EDIT_START", "TOAST", userState.program);
            }
        } else {
            Blockly.getMainWorkspace().startButton.enable();
            displayInformation(result, "", result.message, "");
        }
        refreshBlocklyProgram(result);
    });
}
/**
 * Check program
 */
function checkProgram() {
    LOG.info('check ' + userState.program + ' signed in: ' + userState.id);
    var xmlProgram = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
    var xmlTextProgram = Blockly.Xml.domToText(xmlProgram);
    var xmlTextConfiguration = UTIL.getBricklyFrame('#bricklyFrame').getXmlOfConfiguration(userState.configuration);
    displayMessage("MESSAGE_EDIT_CHECK", "TOAST", userState.program);
    PROGRAM.checkProgramCompatibility(userState.program, userState.configuration, xmlTextProgram, xmlTextConfiguration, function(result) {
        refreshBlocklyProgram(result);
        displayInformation(result, "", result.message, "");
    });
}

/**
 * New program
 */
var newProgram = function() {
    if (userState.programModified) {
        if (userState.id === -1) {
            displayMessage("POPUP_BEFOREUNLOAD", "POPUP", "");
        } else {
            displayMessage("POPUP_BEFOREUNLOAD_LOGGEDIN", "POPUP", "");
        }
        userState.programModified = false;
        return false;
    } else {
        setProgram("NEPOprog");
        userState.programShared = false;
        userState.programTimestamp = '';
        initProgramEnvironment();
        $('#tabProgram').click();
        $('#menuSaveProg').parent().addClass('disabled');
        Blockly.getMainWorkspace().saveButton.disable();
        return true;
    }
};

function showProgram(result, load, name, opt_owner) {
    response(result);
    if (result.rc === 'ok') {
        setProgram(name, opt_owner);
        var xml = Blockly.Xml.textToDom(result.data);
        if (load) {
            Blockly.mainWorkspace.clear();
        }
        Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);
        LOG.info('show program ' + userState.program + ' signed in: ' + userState.id);
    }
}

/**
 * Show configuration in brickly iframe
 * 
 * @param {result}
 *            Result-object of server call
 * @param {load}
 *            load configuration into workspace
 * @param {name}
 *            name of configuration
 */
function showConfiguration(result, load, name) {
    response(result);
    if (result.rc === 'ok') {
        switchToBrickly();
        setConfiguration(name);
        UTIL.getBricklyFrame('#bricklyFrame').showConfiguration(result.data, load);
        LOG.info('show configuration ' + userState.configuration + ' signed in: ' + userState.id);
    }
}

/**
 * Load the program that was selected in program list
 */
function loadFromListing() {
    var $programRow = $('#programNameTable .selected');
    if ($programRow.length > 0) {
        var programName = $programRow[0].children[0].textContent;
        var owner = $programRow[0].children[1].textContent;
        var right = $programRow[0].children[2].textContent;
        userState.programTimestamp = $programRow[0].children[5].textContent;
        LOG.info('loadFromList ' + programName + ' signed in: ' + userState.id);
        PROGRAM.loadProgramFromListing(programName, owner, function(result) {
            if (result.rc === 'ok') {
                userState.programShared = false;
                $('#menuSaveProg').parent().removeClass('disabled');
                Blockly.getMainWorkspace().saveButton.enable();
                if (right === Blockly.Msg.POPUP_SHARE_READ) {
                    $('#menuSaveProg').parent().addClass('disabled');
                    Blockly.getMainWorkspace().saveButton.disable();
                } else if (right === Blockly.Msg.POPUP_SHARE_WRITE) {
                    userState.programShared = true;
                }
                $("#tabs").tabs("option", "active", 0);
                userState.programSaved = true;
                var alien = owner === userState.accountName ? null : owner;
                showProgram(result, true, programName, alien);
                //$('#menuSaveProg').parent().removeClass('login');
            }
            displayInformation(result, "", result.message);
        });
    }
}

/**
 * Load the configuration that was selected in configurations list
 */
function loadConfigurationFromListing() {
    var $configurationRow = $('#configurationNameTable .selected');
    if ($configurationRow.length > 0) {
        var configurationName = $configurationRow[0].children[0].textContent;
        LOG.info('loadFromConfigurationList ' + configurationName + ' signed in: ' + userState.id);
        CONFIGURATION.loadConfigurationFromListing(configurationName, function(result) {
            if (result.rc === 'ok') {
                $("#tabs").tabs("option", "active", 0);
                userState.configurationSaved = true;
                showConfiguration(result, true, configurationName);
                $('#menuSaveConfig').parent().removeClass('login');
                $('#menuSaveConfig').parent().removeClass('disabled');
                setRobotState(result);
            }
            displayInformation(result, "", result.message);
        });
    }
}

/**
 * Share the programs that were selected in program list
 */
function shareProgramsFromListing() {
    // set rights for the user in the text input field 
    var shareWith = $('#programShareWith').val();
    var alreadyShared = false;
    $("#relationsTable tbody tr").each(function(index) {
        var $this = $(this);
        var cols = $this.children("td");
        var userToShareWith = cols.eq(2).text();
        // your cannot share programs twice
        if (userToShareWith === shareWith) {
            alreadyShared = true;
        }
    })
    if (shareWith === userState.name || alreadyShared) {
        // you cannot share programs with yourself
        displayInformation({
            rc : "not ok"
        }, "", "ORA_USER_TO_SHARE_SAME_AS_LOGIN_USER");
        //displayMessage("ORA_USER_TO_SHARE_SAME_AS_LOGIN_USER", "POPUP", "");
    } else {
        if (shareWith !== '') {
            var right = $('#write:checked').val();
            if (!right) {
                right = $('#read:checked').val();
            }
            if (right) {
                var $programRow = $('#programNameTable .selected');
                var programName = $programRow[0].children[0].textContent;
                LOG.info("share program " + programName + " with '" + shareWith + " having right '" + right + "'");
                PROGRAM.shareProgram(programName, shareWith, right, function(result) {
                    displayInformation(result, "", result.message);
                    if (result.rc === 'ok') {
                        $('#show-relations').modal('hide');
                        PROGRAM.refreshList(showPrograms);
                    }
                });
            }
        } else {
            // set rights as set by user in relations table
            $("#relationsTable tbody tr").each(function(index) {
                var $this = $(this);
                var cols = $this.children("td");
                var programName = cols.eq(0).text();
                var userToShareWith = cols.eq(2).text();
                if (userToShareWith !== '') {
                    var readRight = cols.eq(3).children("input:checked").val();
                    var writeRight = cols.eq(4).children("input:checked").val();
                    var right = 'NONE';
                    if (writeRight === 'WRITE') {
                        right = writeRight;
                    } else if (readRight === 'READ') {
                        right = readRight;
                    }
                    LOG.info("share program " + programName + " with '" + userToShareWith + " having right '" + right + "'");
                    PROGRAM.shareProgram(programName, userToShareWith, right, function(result) {
                        if (result.rc === 'ok') {
                            response(result);
                            setRobotState(result);
                            if (right === 'NONE') {
                                displayInformation(result, "MESSAGE_RELATION_DELETED", result.message, programName);
                            }
                            $('#show-relations').modal('hide');
                            PROGRAM.refreshList(showPrograms);
                        } else {
                            displayInformation(result, "", result.message);
                        }
                    });
                }
            });
        }
    }
    $('#programShareWith').val('');
}

/**
 * Delete the programs that were selected in program list
 */
function deleteFromListing() {
    var $programRow = $('#programNameTable .selected');
    var progs = [];
    for (var i = 0; i < $programRow.length; i++) {
        progs.push({
            name : $programRow[i].children[0].textContent,
            owner : $programRow[i].children[1].textContent
        });
    }
    for (var i = 0; i < progs.length; i++) {
        var prog = progs[i];
        LOG.info('deleteFromList ' + prog.name + ' signed in: ' + userState.id);
        if (prog.owner === userState.accountName) {
            PROGRAM.deleteProgramFromListing(prog.name, function(result, progName) {
                response(result);
                if (result.rc === 'ok') {
                    displayInformation(result, "MESSAGE_PROGRAM_DELETED", result.message, progName);
                    PROGRAM.refreshList(showPrograms);
                }
            });
        } else {
            PROGRAM.deleteShare(prog.name, prog.owner, function(result, progName) {
                response(result);
                if (result.rc === 'ok') {
                    displayInformation(result, "MESSAGE_PROGRAM_DELETED", result.message, progName);
                    PROGRAM.refreshList(showPrograms);
                }
            });
        }
    }
    $('.modal').modal('hide');
    setRobotState(result);
}

/**
 * Delete the configurations that were selected in configurations list
 */
function deleteConfigurationFromListing() {
    var $configurationRow = $('#configurationNameTable .selected');
    for (var i = 0; i < $configurationRow.length; i++) {
        var configurationName = $configurationRow[i].children[0].textContent;
        LOG.info('deleteFromConfigurationList ' + configurationName + ' signed in: ' + userState.id);
        CONFIGURATION.deleteConfigurationFromListing(configurationName, function(result) {
            if (result.rc === 'ok') {
                response(result);
                CONFIGURATION.refreshList(showConfigurations);
                setRobotState(result);
            }
            displayInformation(result, "MESSAGE_CONFIGURATION_DELETED", result.message, configurationName);
        });
    }
}

/**
 * Show toolbox
 * 
 * @param {result}
 *            result of server call
 * @param {toolbox}
 *            toolbox to show
 */
function showToolbox(result, toolbox) {
    response(result);
    if (result.rc === 'ok') {
        userState.toolbox = toolbox;
        Blockly.updateToolbox(result.data);
        setRobotState(result);
        if (toolbox === "beginner") {
            $('#menuToolboxBeginner').parent().addClass('disabled');
            $('#menuToolboxExpert').parent().removeClass('disabled');
            $('#menuToolboxSimulation').parent().removeClass('disabled');
        } else if (toolbox === "expert") {
            $('#menuToolboxExpert').parent().addClass('disabled');
            $('#menuToolboxBeginner').parent().removeClass('disabled');
            $('#menuToolboxSimulation').parent().removeClass('disabled');
        }
        userState.blocklyTranslated = true;
    }
}

/**
 * Load toolbox from server
 * 
 * @param {toolbox}
 *            toolbox to be loaded
 */
function loadToolbox(toolboxName) {
    COMM.json("/toolbox", {
        "cmd" : "loadT",
        "name" : toolboxName,
        "owner" : " "
    }, function(toolbox) {
        showToolbox(toolbox, toolboxName);
    });
}

/**
 * Display programs in a table
 * 
 * @param {result}
 *            result object of server call
 */
function showPrograms(result) {
    response(result);
    if (result.rc === 'ok') {
        var $table = $('#programNameTable').dataTable();
        $table.fnClearTable();
        if (result.programNames.length > 0) {
            $table.fnAddData(result.programNames);
        }
        setRobotState(result);
    }
}

/**
 * Display configurations in a table
 * 
 * @param {result}
 *            result object of server call
 */
function showConfigurations(result) {
    response(result);
    if (result.rc === 'ok') {
        var $table = $('#configurationNameTable').dataTable();
        $table.fnClearTable();
        if (result.configurationNames.length > 0) {
            $table.fnAddData(result.configurationNames);
        }
        setRobotState(result);
    }
}

/**
 * Display relations of programs in a table
 * 
 * @param {result}
 *            result object of server call
 */
function showRelations(result) {
    response(result);
    if (result.rc === 'ok') {
        var $table = $('#relationsTable').dataTable();
        $table.fnClearTable();
        if (result.relations.length > 0) {
            $table.fnAddData(result.relations);
        }
        // This is a WORKAROUND for a known bug in Jquery-datatables:
        // If scrollY is set the column headers have the wrong width,
        // because the browser is not able to calculate them correctly. So
        // after a while (in this case 200 ms) the columns have to be readjusted.
        setTimeout(function() {
            $table.fnAdjustColumnSizing();
        }, 200);
        $("#show-relations").modal('show');
    }
}

/**
 * Select row in programs-/configurations-/relations-datatable
 */
var start;
function selectionFn(event) {
    $(event.target.parentNode).toggleClass('selected');
    var rowIndex = event.currentTarget.rowIndex;

    if (!start) {
        start = rowIndex;
    }

    // Shift-Click ?
    if (event.shiftKey) {
        var end = rowIndex;
        $('#programNameTable tbody tr').removeClass("selected");
        for (i = Math.min(start, end); i <= Math.max(start, end); i++) {
            if (!$(event.target.parentNode.parentNode.childNodes).eq(i).hasClass("selected")) {
                $(event.target.parentNode.parentNode.childNodes).eq(i).addClass("selected");
            }
        }

        // Clear browser text selection mask
        if (window.getSelection) {
            if (window.getSelection().empty) { // Chrome
                window.getSelection().empty();
            } else if (window.getSelection().removeAllRanges) { // Firefox
                window.getSelection().removeAllRanges();
            }
        } else if (document.selection) { // IE?
            document.selection.empty();
        }
    }

    start = rowIndex;
}

function beforeActivateTab(event, ui) {
    $('#tabs').tabs("refresh");
    if (ui.newPanel.selector === '#progListing') {
        PROGRAM.refreshList(showPrograms);
    } else if (ui.newPanel.selector === '#confListing') {
        CONFIGURATION.refreshList(showConfigurations);
    }
}

/**
 * Initialize table of programs
 */
function initProgramNameTable() {
    var columns = [ {
        "sTitle" : "<span lkey='Blockly.Msg.DATATABLE_PROGRAM_NAME'>Name des Programms</span>",
        "sClass" : "programs"
    }, {
        "sTitle" : "<span lkey='Blockly.Msg.DATATABLE_CREATED_BY'>Erzeugt von</span>",
        "sClass" : "programs"
    }, {
        "sTitle" : "<span lkey='Blockly.Msg.DATATABLE_SHARED'>Geteilt</span>",
        "sClass" : "programs"
    }, {
        "sTitle" : "<span lkey='Blockly.Msg.DATATABLE_CREATED_ON'>Erzeugt am</span>",
        "sClass" : "programs"
    }, {
        "sTitle" : "<span lkey='Blockly.Msg.DATATABLE_ACTUALIZATION'>Letzte Aktualisierung</span>",
        "sClass" : "programs"
    }, {
        "sTitle" : "<span lkey='Blockly.Msg.DATATABLE_ACTUALIZATION'>Letzte Aktualisierung mit Hundertstel Sekunden</span>",
        "sClass" : "programs hidden"
    } ];
    var $programs = $('#programNameTable');

    var oTable = $programs.dataTable({
        "sDom" : '<lip>t<r>',
        "aaData" : [],
        "aoColumns" : columns,
        "aoColumnDefs" : [ { // format fields
            "aTargets" : [ 3, 4 ], // indexes of columns to be formatted
            "sType" : "date-de",
            "mRender" : function(data) {
                return UTIL.formatDate(data);
            }
        }, {
            "aTargets" : [ 2 ], // indexes of columns to be formatted
            "mRender" : function(data, type, row) {
                if (data === 'WRITE') {
                    var returnval = "<span lkey='Blockly.Msg.POPUP_SHARE_WRITE'>" + Blockly.Msg.POPUP_SHARE_WRITE + "</span>";
                } else if (data === "READ") {
                    var returnval = "<span lkey='Blockly.Msg.POPUP_SHARE_READ'>" + Blockly.Msg.POPUP_SHARE_READ + "</span>";
                } else if (data === true) {
                    var returnval = "<span lkey='Blockly.Msg.POPUP_SHARE_READ'>X</span>";
                } else if (data === false) {
                    var returnval = "<span lkey='Blockly.Msg.POPUP_SHARE_READ'>-</span>";
                }
                return returnval;
            }
        } ],
        "bJQueryUI" : true,
        "oLanguage" : {
            "sEmptyTable" : "<span lkey='Blockly.Msg.DATATABLE_EMPTY_TABLE'></span>" // Die Tabelle ist leer
        },
        "fnDrawCallback" : function() {
        },
        "scrollY" : UTIL.calcDataTableHeight(),
        "scrollCollapse" : true,
        "paging" : false,
        "bInfo" : false
    });

    $(window).resize(function() {
        var oSettings = oTable.fnSettings();
        oSettings.oScroll.sY = UTIL.calcDataTableHeight();
        oTable.fnDraw(false); // redraw the table
    });

    $('#programNameTable tbody').onWrap('click', 'tr', selectionFn);
    $('#programNameTable tbody').onWrap('dblclick', 'tr', function(event) {
        selectionFn(event);
        $('#loadFromListing').click();
    });
}

/**
 * Initialize configurations table
 */
function initConfigurationNameTable() {
    var columns = [ {
        "sTitle" : "<span lkey='Blockly.Msg.DATATABLE_CONFIGURATION_NAME'>Name der Konfiguration</span>",
        "sClass" : "configurations"
    }, {
        "sTitle" : "<span lkey='Blockly.Msg.DATATABLE_CREATED_BY'>Erzeugt von</span>",
        "sClass" : "configurations"
    }, {
        "sTitle" : "<span lkey='Blockly.Msg.DATATABLE_CREATED_ON'>Erzeugt am</span>",
        "sClass" : "configurations"
    }, {
        "sTitle" : "<span lkey='Blockly.Msg.DATATABLE_ACTUALIZATION'>Letzte Aktualisierung</span>",
        "sClass" : "configurations"
    } ];
    var $configurations = $('#configurationNameTable');

    var oTable = $configurations.dataTable({
        "sDom" : '<lip>t<r>',
        "aaData" : [],
        "aoColumns" : columns,
        "aoColumnDefs" : [ { // format date fields
            "aTargets" : [ 2, 3 ], // indexes of columns to be formatted
            "sType" : "date-de",
            "mRender" : function(data) {
                return UTIL.formatDate(data);
            }
        } ],
        "bJQueryUI" : true,
        "oLanguage" : {
            "sEmptyTable" : "<span lkey='Blockly.Msg.DATATABLE_EMPTY_TABLE'></span>" //Die Tabelle ist leer
        },
        "fnDrawCallback" : function() {
        },
        "scrollY" : UTIL.calcDataTableHeight(),
        "scrollCollapse" : true,
        "paging" : false,
        "bInfo" : false
    });

    $(window).resize(function() {
        var oSettings = oTable.fnSettings();
        oSettings.oScroll.sY = UTIL.calcDataTableHeight();
        oTable.fnDraw(false); // redraw the table
    });

    $('#configurationNameTable tbody').onWrap('click', 'tr', selectionFn);
    $('#configurationNameTable tbody').onWrap('dblclick', 'tr', function(event) {
        selectionFn(event);
        $('#loadConfigurationFromListing').click();
    });
}

/**
 * Initialize relations table
 */
function initRelationsTable() {
    var columns = [ {
        "sTitle" : "<span lkey='Blockly.Msg.DATATABLE_PROGRAM_NAME'>Name des Programms</span>",
        "sClass" : "relations hidden"
    }, {
        "sTitle" : "<span lkey='Blockly.Msg.DATATABLE_CREATED_BY'>Erzeugt von</span>",
        "sClass" : "relations hidden"
    }, {
        "sTitle" : "<span lkey='Blockly.Msg.DATATABLE_SHARED_WITH'>Geteilt mit</span>",
        "sClass" : "relations"
    }, {
        "sTitle" : "<span lkey='Blockly.Msg.POPUP_SHARE_READ'>Lesen</span>",
        "sClass" : "relations"
    }, {
        "sTitle" : "<span lkey='Blockly.Msg.POPUP_SHARE_WRITE'>Schreiben</span>",
        "sClass" : "relations"
    } ];
    var $relations = $('#relationsTable');

    var oTable = $relations.dataTable({
        "sDom" : '<lip>t<r>',
        "aaData" : [],
        "aoColumns" : columns,
        "aoColumnDefs" : [ { // format language dependant fields
            "aTargets" : [ 3 ], // indexes of columns to be formatted
            "mRender" : function(data, type, row) {
                var checked = '';
                if (row[4] === 'WRITE' || data === 'READ') {
                    checked = 'checked';
                }
                var returnval = "<td><input class='readRight' type='checkbox' name='right' value='READ' " + checked + "></td>";
                return returnval;
            }
        }, {
            "aTargets" : [ 4 ], // indexes of columns to be formatted
            "mRender" : function(data, type, row) {
                var checked = '';
                if (data === 'WRITE') {
                    checked = 'checked';
                }
                var returnval = "<td><input class='writeRight' type='checkbox' name='right' value='WRITE' " + checked + "></td>";
                return returnval;
            }
        } ],
        "bJQueryUI" : true,
        "oLanguage" : {
            "sEmptyTable" : "<span lkey='Blockly.Msg.DATATABLE_EMPTY_TABLE'></span>" // Die Tabelle ist leer
        },
        "fnDrawCallback" : function() {
        },
        "scrollY" : UTIL.calcDataTableHeight(),
        "scrollCollapse" : true,
        "paging" : false,
        "bInfo" : false
    });

    $(window).resize(function() {
        var oSettings = oTable.fnSettings();
        oSettings.oScroll.sY = UTIL.calcDataTableHeight();
        oTable.fnDraw(false); // redraw the table
    });

    $('#relationsTable tbody').onWrap('click', 'tr', selectionFn);
    $('#relationsTable_wrapper').css('margin', 0);
}

/**
 * Switch to Blockly tab
 */
function switchToBlockly() {
    $('#tabs').css('display', 'inline');
    $('#bricklyFrame').css('display', 'none');
    $('#simConfiguration').css('display', 'none');
    $('#tabBlockly').click();
    // do this twice :-( to make sure all metrics are calculated correctly.
    Blockly.getMainWorkspace().render();
    Blockly.getMainWorkspace().render();
    bricklyActive = false;
}

/**
 * Switch to Brickly tab
 */
function switchToBrickly() {
    if (userState.robot === "oraSim") { //simulation has no configuration, TODO add flag to robot in database
        $('#simConfiguration').css('display', 'block');
    } else {
        $('#bricklyFrame').css('display', 'inline');
        $('#tabs').css('display', 'none');
        // This is only for firefox necessary, should be removed with new Blockly
        UTIL.getBricklyFrame('#bricklyFrame').Blockly.getMainWorkspace().render();
        UTIL.getBricklyFrame('#bricklyFrame').loadToolbox();
    }
    $('#tabBrickly').click();
    bricklyActive = true;
}
/**
 * Init robot
 */
function initRobot() {
    ROBOT.setRobot(userState.robot, function(result) {
        response(result);
        if (result.rc === "ok") {
            setConfiguration("EV3basis");
            loadToolbox(userState.toolbox);
            $('#blocklyDiv').removeClass('simBackground');
            $('#menuEv3').parent().addClass('disabled');
            $('#menuSim').parent().removeClass('disabled');
            $('#menuConnect').parent().removeClass('disabled');
            $('#iconDisplayRobotState').removeClass('typcn-Roberta');
            $('#iconDisplayRobotState').addClass('typcn-ev3');
            $('#menuShowCode').parent().removeClass('disabled');
        }
    });
}

/**
 * Switch robot
 */
function switchRobot(robot) {
    if (robot === userState.robot) {
        return;
    }
    ROBOT.setRobot(robot, function(result) {
        if (result.rc === "ok") {
            userState.robot = robot;
            setRobotState(result);
            if (robot === "ev3") {
                setConfiguration("EV3basis");
                $('#blocklyDiv').removeClass('simBackground');
                $('#menuEv3').parent().addClass('disabled');
                $('#menuSim').parent().removeClass('disabled');
                $('#menuConnect').parent().removeClass('disabled');
                $('#iconDisplayRobotState').removeClass('typcn-Roberta');
                $('#iconDisplayRobotState').addClass('typcn-ev3');
                $('#menuShowCode').parent().removeClass('disabled');
                Blockly.getMainWorkspace().codeButton.enable();
                UTIL.getBricklyFrame('#bricklyFrame').loadToolboxAndConfiguration();
            } else if (robot === "oraSim") {
                setConfiguration("ORSim");
                $('#blocklyDiv').addClass('simBackground');
                $('#menuEv3').parent().removeClass('disabled');
                $('#menuSim').parent().addClass('disabled');
                $('#menuConnect').parent().addClass('disabled');
                $('#iconDisplayRobotState').removeClass('typcn-ev3');
                $('#iconDisplayRobotState').addClass('typcn-Roberta');
                $('#menuShowCode').parent().addClass('disabled');
                Blockly.getMainWorkspace().codeButton.disable();
                PROGRAM.loadProgramFromListing('NEPOprog', 'Roberta', function(result) {
                    if (result.rc === 'ok') {
                        showProgram(result, true, 'NEPOprog');
                    }
                });
            }
            loadToolbox(userState.toolbox);
        }
    });
}

function setHeadNavigationMenuState(state) {
    $('.nav > li > ul > .login, .logout').removeClass('disabled');
    if (state === 'login') {
        $('.nav > li > ul > .login').addClass('disabled');
    } else if (state === 'logout') {
        $('.nav > li > ul > .logout').addClass('disabled');
    }
}

/**
 * Initialize the navigation bar in the head of the page
 */
function initHeadNavigation() {
    $('.navbar-fixed-top').onWrap('click', '.dropdown-menu li:not(.disabled) a', function(event) {
        Blockly.hideChaff();
        $('.modal').modal('hide'); // close all opened popups
        var domId = event.target.id;
        if (domId === 'menuRunProg') { //  Submenu 'Program'   
            runOnBrick();
        } else if (domId === 'menuCheckProg') { //  Submenu 'Program'
            checkProgram();
        } else if (domId === 'menuNewProg') { //  Submenu 'Program'
            newProgram();
        } else if (domId === 'menuListProg') { //  Submenu 'Program'
            deactivateProgConfigMenu();
            $('#tabListing').click();
        } else if (domId === 'menuSaveProg') { //  Submenu 'Program'
            saveToServer();
        } else if (domId === 'menuSaveAsProg') { //  Submenu 'Program'
            $("#save-program").modal('show');
        } else if (domId === 'menuShowCode') { //  Submenu 'Program'
            showCode();
        } else if (domId === 'menuToolboxBeginner') { // Submenu 'Program'
            loadToolbox('beginner');
        } else if (domId === 'menuToolboxExpert') { // Submenu 'Program'
            loadToolbox('expert');
        } else if (domId === 'menuCheckConfig') { //  Submenu 'Configuration'
            displayMessage("MESSAGE_NOT_AVAILABLE", "POPUP", "");
        } else if (domId === 'menuNewConfig') { //  Submenu 'Configuration'
            setConfiguration("EV3basis");
            UTIL.getBricklyFrame('#bricklyFrame').initConfigurationEnvironment();
            $('#menuSaveConfig').parent().addClass('disabled');
            UTIL.getBricklyFrame('#bricklyFrame').Blockly.getMainWorkspace().saveButton.disable();
        } else if (domId === 'menuListConfig') { //  Submenu 'Configuration'
            deactivateProgConfigMenu();
            $('#tabs').css('display', 'inline');
            $('#bricklyFrame').css('display', 'none');
            $('#simConfiguration').css('display', 'none');
            $('#tabConfigurationListing').click();
        } else if (domId === 'menuSaveConfig') { //  Submenu 'Configuration'
            saveConfigurationToServer();
        } else if (domId === 'menuSaveAsConfig') { //  Submenu 'Configuration'
            $("#save-configuration").modal("show");
        } else if (domId === 'menuEv3') { // Submenu 'Robot'
            if (newProgram()) {
                switchRobot('ev3');
            }
        } else if (domId === 'menuSim') { // Submenu 'Robot'
            if (newProgram()) {
                switchRobot('oraSim');
            }
        } else if (domId === 'menuConnect') { // Submenu 'Robot'
            $('#buttonCancelFirmwareUpdate').css('display', 'inline');
            $('#buttonCancelFirmwareUpdateAndRun').css('display', 'none');
            $("#set-token").modal("show");
        } else if (domId === 'menuRobotInfo') { // Submenu 'Robot'
            showRobotInfo();
        } else if (domId === 'menuGeneral') { // Submenu 'Help'
            window.open("https://mp-devel.iais.fraunhofer.de/wiki/x/BIAM");
        } else if (domId === 'menuEV3conf') { // Submenu 'Help'
            window.open("https://mp-devel.iais.fraunhofer.de/wiki/x/RIAd");
        } else if (domId === 'menuProgramming') { // Submenu 'Help'
            window.open("https://mp-devel.iais.fraunhofer.de/wiki/x/CwA-/");
        } else if (domId === 'menuFaq') { // Submenu 'Help'
            window.open("https://mp-devel.iais.fraunhofer.de/wiki/x/BoAd");
        } else if (domId === 'menuShowRelease') { // Submenu 'Help'
            $("#show-release").modal("show");
        } else if (domId === 'menuStateInfo') { // Submenu 'Help'
            showUserInfo();
        } else if (domId === 'menuAbout') { // Submenu 'Help'
            $("#version").text(userState.version);
            $("#show-about").modal("show");
        } else if (domId === 'menuLogging') { // Submenu 'Help'
            deactivateProgConfigMenu();
            $('#tabs').css('display', 'inline');
            $('#bricklyFrame').css('display', 'none');
            $('#simConfiguration').css('display', 'none');
            $('#tabLogging').click();
        } else if (domId === 'menuLogin') { // Submenu 'Login'
            ROBERTA_USER.showLoginForm();
        } else if (domId === 'menuLogout') { // Submenu 'Login'
            logout();
        } else if (domId === 'menuNewUser') { // Submenu 'Login'
            $("#register-user").modal('show');
        } else if (domId === 'menuChangeUser') { // Submenu 'Login'
            ROBERTA_USER.showUserDataForm();
        } else if (domId === 'menuDeleteUser') { // Submenu 'Login'
            ROBERTA_USER.showDeleteUserModal();
        }
        return false;
    }, 'head navigation menu item clicked');

    $('.navbar-fixed-top .navbar-nav').onWrap('click', 'li:not(.disabled) a', function(event) {
        var domId = event.target.id;
        if (domId === 'menuTabProgram') {
            if ($('#tabSimulation').hasClass('tabClicked')) {
                $('.scroller-left').click();
            }
            $('.scroller-left').click();
            $('#tabProgram').click();
        } else if (domId === 'menuTabConfiguration') {
            if ($('#tabProgram').hasClass('tabClicked')) {
                $('.scroller-right').click();
            } else if ($('#tabConfiguration').hasClass('tabClicked')) {
                $('.scroller-right').click();
            }
            $('#tabConfiguration').click();
        }
        return false;
    });

// Close submenu on mouseleave
    $('.navbar-fixed-top').onWrap('mouseleave', function(event) {
        $('.navbar-fixed-top .dropdown').removeClass('open');
    });

    $('#imgLogo, #imgBeta').onWrap('click', function() {
        window.open('http://open-roberta.org');
    }, 'logo was clicked');

    $('#beta').onWrap('click', function() {
        window.open('http://open-roberta.org');
    }, 'beta logo was clicked');

    $('#iconDisplayLogin').onWrap('click', function() {
        showUserInfo();
    }, 'icon user click');

    $('#iconDisplayRobotState').onWrap('click', function() {
        showRobotInfo();
    }, 'icon robot click');

    $('#tabProgram').onWrap('click', function() {
        activateProgConfigMenu();
        $('#tabProgram').addClass('tabClicked');
        $('#tabConfiguration').removeClass('tabClicked');
        $('#tabSimulation').removeClass('tabClicked');
        $('#head-navigation-program-edit').css('display', 'inline');
        $('#head-navigation-configuration-edit').css('display', 'none');
        $('#menuTabProgram').parent().addClass('disabled');
        $('#menuTabConfiguration').parent().removeClass('disabled');
        $('#menuTabSimulation').parent().removeClass('disabled');
        switchToBlockly();
    }, 'tabProgram clicked');

    $('#tabConfiguration').onWrap('click', function() {
        Blockly.hideChaff();
        activateProgConfigMenu();
        $('#tabProgram').removeClass('tabClicked');
        $('#tabConfiguration').addClass('tabClicked');
        $('#tabSimulation').removeClass('tabClicked');
        $('#head-navigation-program-edit').css('display', 'none');
        $('#head-navigation-configuration-edit').css('display', 'inline');
        $('#menuTabProgram').parent().removeClass('disabled');
        $('#menuTabConfiguration').parent().addClass('disabled');
        $('#menuTabSimulation').parent().removeClass('disabled');
        switchToBrickly();
    }, 'tabConfiguration clicked');

// controle for simulation
    $('.simSimple').onWrap('click', function(event) {
        $('.menuSim').parent().removeClass('disabled');
        $('.simSimple').parent().addClass('disabled');
        SIM.setBackground(1);
        $("#simButtonsCollapse").collapse('hide');
    }, 'simSimple clicked');
    $('.simDraw').onWrap('click', function(event) {
        $('.menuSim').parent().removeClass('disabled');
        $('.simDraw').parent().addClass('disabled');
        SIM.setBackground(2);
        $("#simButtonsCollapse").collapse('hide');
    }, 'simDraw clicked');
    $('.simRoberta').onWrap('click', function(event) {
        $('.menuSim').parent().removeClass('disabled');
        $('.simRoberta').parent().addClass('disabled');
        SIM.setBackground(3);
        $("#simButtonsCollapse").collapse('hide');
    }, 'simRoberta clicked');
    $('.simRescue').onWrap('click', function(event) {
        $('.menuSim').parent().removeClass('disabled');
        $('.simRescue').parent().addClass('disabled');
        SIM.setBackground(4);
        $("#simButtonsCollapse").collapse('hide');
    }, 'simRescue clicked');
    $('.simMath').onWrap('click', function(event) {
        $('.menuSim').parent().removeClass('disabled');
        $('.simMath').parent().addClass('disabled');
        SIM.setBackground(5);
        $("#simButtonsCollapse").collapse('hide');
    }, 'simRescue clicked');
    $('.simBack').onWrap('click', function(event) {
        SIM.cancel();
        $('#blocklyDiv').removeClass('simActive');
        $('#simDiv').removeClass('simActive');
        $(".sim").addClass('hide');
        Blockly.fireUiEvent(window, 'resize');
        $('.nav > li > ul > .robotType').removeClass('disabled');
        $('#menuSim').parent().addClass('disabled');
        COMM.json("/toolbox", {
            "cmd" : "loadT",
            "name" : userState.toolbox,
            "owner" : " "
        }, function(result) {
            injectBlockly(result, userState.programBlocksSaved);
        });
        $("#simButtonsCollapse").collapse('hide');
        $("#head-navi-tooltip-program").removeClass('disabled');
        $('#head-navigation-program-edit').removeClass('disabled');
        $('#head-navigation-program-edit>ul').removeClass('hidden');
    }, 'simBack clicked');
    $('.simStop').onWrap('click', function(event) {
        SIM.stopProgram();
        $("#simButtonsCollapse").collapse('hide');
    }, 'simStop clicked');
    $('.simForward').onWrap('click', function(event) {
        if ($('.simForward').hasClass('typcn-media-play')) {
            SIM.setPause(false);
        } else {
            SIM.setPause(true);
        }
        $("#simButtonsCollapse").collapse('hide');
    }, 'simForward clicked');
    $('.simStep').onWrap('click', function(event) {
        SIM.setStep();
        $("#simButtonsCollapse").collapse('hide');
    }, 'simStep clicked');
    $('.simInfo').onWrap('click', function(event) {
        SIM.setInfo();
        $("#simButtonsCollapse").collapse('hide');
    }, 'simInfo clicked');
    $('.simScene').onWrap('click', function(event) {
        SIM.setBackground(0);
        var scene = $("#simButtonsCollapse").collapse('hide');
        $('.menuSim').parent().removeClass('disabled');
        if (scene == 1) {
            $('.simSimple').parent().addClass('disabled');
        } else if (scene == 2) {
            $('.simDraw').parent().addClass('disabled');
        } else if (scene == 3) {
            $('.simRoberta').parent().addClass('disabled');
        } else if (scene == 4) {
            $('.simRescue').parent().addClass('disabled');
        } else if (scene == 5) {
            $('.simMath').parent().addClass('disabled');
        }
    }, 'simScene clicked');

    $('#startSim').onWrap('click', function(event) {
        switchRobot('oraSim');
    }, 'start with simulation clicked');
    $('#startEV3').onWrap('click', function(event) {
        switchRobot('ev3');
    }, 'start with ev3 clicked');
    $('.codeBack').onWrap('click', function(event) {
        $('#blocklyDiv').removeClass('codeActive');
        $('#codeDiv').removeClass('codeActive');
        if (userState.robot === "oraSim") {
            $('#menuEv3').parent().removeClass('disabled');
        } else {
            $('#menuSim').parent().removeClass('disabled');
        }
        Blockly.fireUiEvent(window, 'resize')
        COMM.json("/toolbox", {
            "cmd" : "loadT",
            "name" : userState.toolbox,
            "owner" : " "
        }, function(result) {
            injectBlockly(result, userState.programBlocksSaved);
        });
        $("#head-navi-tooltip-program").removeClass('disabled');
        $('#head-navigation-program-edit').removeClass('disabled');
        $('#head-navigation-program-edit>ul').removeClass('hidden');
        $(".code").addClass('hide');
    }, 'codeBack clicked');

    $('#codeDownload').onWrap('click', function(event) {
        var blob = new Blob([ userState.programCode ]);
        var element = document.createElement('a');
        var myURL = window.URL || window.webkitURL;
        element.setAttribute('href', myURL.createObjectURL(blob));
        element.setAttribute('download', userState.program + ".java");
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }, 'codeDownload clicked');

    $('.newRelease').onWrap('click', function(event) {
        $('#show-release').modal("show");
    }, 'show release clicked');
}

/**
 * Initialize popups
 */
function initPopups() {

    $('#saveProgram').onWrap('click', saveAsProgramToServer);
    $('#saveConfiguration').onWrap('click', saveAsConfigurationToServer);

    $('#shareProgram').onWrap('click', function() {
        $('#show-about').modal('hide');
    });

    $('#setToken').onWrap('click', function() {
        setToken($('#tokenValue').val());
    }, 'set token');

    $('.cancelPopup').onWrap('click', function() {
        $('.ui-dialog-titlebar-close').click();
    });

    $('#about-join').onWrap('click', function() {
        $('#show-about').modal('hide');
    });

    $('#delete-user').onWrap('hidden.bs.modal', function() {
        $('#delete-user input :not(btn)').val('');
    });

    $('#buttonCancelFirmwareUpdateAndRun').onWrap('click', function() {
        startProgram();
    });

    $('#doUpdateFirmware').onWrap('click', function() {
        $('#set-token').modal('hide');
        $('#confirmUpdateFirmware').modal('hide');
        updateFirmware();
    }, 'update firmware of robot');

    ROBERTA_USER.initUserForms();

    var target = document.location.hash.split("&");

    if (target[0] === "#forgotPassword") {
        $('#change-user-password').modal('show');
    }
}

/**
 * Initialize tabs
 */
function initTabs() {
    $('#tabs').tabs({
        heightStyle : 'content',
        active : 0,
        beforeActivate : beforeActivateTab
    });

    // load program
    $('#loadFromListing').onWrap('click', function() {
        activateProgConfigMenu();
        loadFromListing();
    }, 'load blocks from program list');

    // load configuration
    $('#loadConfigurationFromListing').onWrap('click', function() {
        activateProgConfigMenu();
        loadConfigurationFromListing();
    }, 'load configuration from configuration list');

    // confirm program deletion
    $('#deleteFromListing').onWrap('click', function() {
        var $programRow = $('#programNameTable .selected');
        if ($programRow.length > 0) {
            var names = '';
            for (var i = 0; i < $programRow.length; i++) {
                names += ($programRow[i].children[0].textContent + '</br>');
            }
            $('#confirmDeleteProgramName').html(names);
            $("#confirmDeleteProgram").modal("show");
        }
    }, 'Ask for confirmation to delete programs');

    // delete program
    $('#doDeleteProgram').onWrap('click', function() {
        deleteFromListing();
        //  $('.modal').modal('hide'); // close all opened popups
    }, 'delete program');

    // confirm configuration deletion
    $('#deleteConfigurationFromListing').onWrap('click', function() {
        if ($('#configurationNameTable .selected').length > 0) {
            $("#confirmDeleteConfiguration").modal("show");
        }
    }, 'Ask for confirmation to delete a configuration');

    // delete configuration
    $('#doDeleteConfiguration').onWrap('click', function() {
        deleteConfigurationFromListing();
        $('.modal').modal('hide'); // close all opened popups
    }, 'delete configuration from configurations list');

    // show relations of program
    $('#shareFromListing').onWrap('click', function() {
        var $programRow = $('#programNameTable .selected');
        if ($programRow.length > 0) {
            var shared = $programRow[0].children[2].textContent;
            if (shared === 'X' || shared === '-') {
                var programName = $programRow[0].children[0].textContent;
                var headShare = Blockly.Msg.BUTTON_DO_SHARE + ' (' + programName + ')';
                $('#headShare').text(headShare);
                $('#programShareWith :not(btn)').val('');
                $('#read').prop("checked", true);
                $('#write').prop("checked", false);
                PROGRAM.refreshProgramRelationsList(programName, showRelations);
            }
        }
    }, 'show relations of program');

    // Refresh list of programs
    $('#refreshListing').onWrap('click', function() {
        PROGRAM.refreshList(showPrograms);
    }, 'refresh list of programs');

    $('#backConfiguration').onWrap('click', function() {
        activateProgConfigMenu();
        switchToBrickly();
    });

    $('#backProgram').onWrap('click', function() {
        activateProgConfigMenu();
        switchToBlockly();
    });

    $('#backLogging').onWrap('click', function() {
        activateProgConfigMenu();
        if (bricklyActive) {
            switchToBrickly();
        } else {
            switchToBlockly();
        }
    });
}

/**
 * Initialize logging
 */
function initLogging() {
    $('#clearLog').onWrap('click', function() {
        $('#log li').remove();
    }, 'clear LOG list');
}

/**
 * Set robot state
 * 
 * @param {result}
 *            result of server call
 */
function setRobotState(result) {
    if (result['version']) {
        userState.version = result.version;
    }
    if (result['server.version']) {
        userState.serverVersion = result['server.version'];
    }
    if (result['robot.version']) {
        userState.robotVersion = result['robot.version'];
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

    if (userState.accountName) {
        $('#iconDisplayLogin').removeClass('error');
        $('#iconDisplayLogin').addClass('ok');
    } else {
        $('#iconDisplayLogin').removeClass('ok');
        $('#iconDisplayLogin').addClass('error');
    }
    if (userState.robotState === 'wait') {
        $('#iconDisplayRobotState').removeClass('error');
        $('#iconDisplayRobotState').removeClass('busy');
        $('#iconDisplayRobotState').addClass('wait');
        if (Blockly.hasStartButton) {
            Blockly.getMainWorkspace().startButton.enable();
        }
    } else if (userState.robotState === 'busy') {
        $('#iconDisplayRobotState').removeClass('wait');
        $('#iconDisplayRobotState').removeClass('error');
        $('#iconDisplayRobotState').addClass('busy');
    } else {
        $('#iconDisplayRobotState').removeClass('busy');
        $('#iconDisplayRobotState').removeClass('wait');
        $('#iconDisplayRobotState').addClass('error');
    }

}

/**
 * Translate the web page
 */
function translate(jsdata) {
    $("[lkey]").each(function(index) {
        var lkey = $(this).attr('lkey');
        var key = lkey.replace("Blockly.Msg.", "");
        var value = Blockly.Msg[key];
        if (value == undefined) {
            console.log('UNDEFINED    key : value = ' + key + ' : ' + value);
        }
        if (lkey === 'Blockly.Msg.MENU_LOG_IN') {
            $('#loginLabel').text(value);
            $(this).html(value);
        } else if (lkey === 'Blockly.Msg.MENU_SAVE_AS') {
            $('#save-program h3').text(value);
            $('#save-configuration h3').text(value);
            $(this).html(value);
        } else if (lkey === 'Blockly.Msg.MENU_CONNECT') {
            $('#set-token h3').text(value);
            $(this).html(value);
        } else if (lkey === 'Blockly.Msg.POPUP_HIDE_STARTUP_MESSAGE') {
            $('#hideStartupMessage').text(value);
        } else if (lkey === 'Blockly.Msg.POPUP_TEXT_STARTUP_MESSAGE') {
            $('#popupTextStartupMessage').html(value);
        } else if (lkey === 'Blockly.Msg.POPUP_ATTENTION') {
            $('#show-message h3').text(value);
            $('#show-startup-message h3').text(value);
        } else if (lkey === 'Blockly.Msg.POPUP_CANCEL') {
            $('.cancelPopup').attr('value', value);
            $('.backButton').attr('value', value);
        } else if (lkey === 'Blockly.Msg.POPUP_CHANGE_PASSWORD') {
            $('#showChangeUserPassword').attr('value', value);
        } else if (lkey === 'Blockly.Msg.POPUP_ABOUT_JOIN') {
            $('#about-join').html(value);
        } else if (lkey === 'Blockly.Msg.BUTTON_LOAD') {
            $('.buttonLoad').attr('value', value);
        } else if (lkey === 'Blockly.Msg.BUTTON_DO_DELETE') {
            $('.buttonDelete').attr('value', value);
        } else if (lkey === 'Blockly.Msg.BUTTON_DO_SHARE') {
            $('.buttonShare').attr('value', value);
            $('#show-relations h2').text(value);
        } else if (lkey === 'Blockly.Msg.BUTTON_REFRESH') {
            $('.buttonRefresh').attr('value', value);
        } else if (lkey === 'Blockly.Msg.BUTTON_EMPTY_LIST') {
            $('#clearLog').attr('value', value);
        } else if (lkey === 'Blockly.Msg.MENU_ROBOT_STATE_INFO') {
            $('#show-robot-info h3').text(value);
            $(this).html(value);
        } else if (lkey === 'Blockly.Msg.MENU_STATE_INFO') {
            $('#show-state-info h3').text(value);
            $(this).html(value);
        } else if (lkey === 'Blockly.Msg.MENU_ABOUT') {
            $('#show-about h3').text(value);
            $(this).html(value);
        } else if (lkey === 'Blockly.Msg.MENU_TITLE_EDIT') {
            $('#head-navi-tooltip-program').attr('data-original-title', value).tooltip('fixTitle');
            $('#head-navi-tooltip-configuration').attr('data-original-title', value).tooltip('fixTitle');
        } else if (lkey === 'Blockly.Msg.MENU_TITLE_ROBOT') {
            $('#head-navi-tooltip-robot').attr('data-original-title', value).tooltip('fixTitle');
        } else if (lkey === 'Blockly.Msg.MENU_TITLE_HELP') {
            $('#head-navi-tooltip-help').attr('data-original-title', value).tooltip('fixTitle');
        } else if (lkey === 'Blockly.Msg.MENU_TITLE_USER') {
            $('#head-navi-tooltip-user').attr('data-original-title', value).tooltip('fixTitle');
        } else if (lkey === 'Blockly.Msg.MENU_TITLE_USER_STATE') {
            $('#iconDisplayLogin').attr('data-original-title', value).tooltip('fixTitle');
        } else if (lkey === 'Blockly.Msg.MENU_TITLE_ROBOT_STATE') {
            $('#iconDisplayRobotState').attr('data-original-title', value).tooltip('fixTitle');
        } else {
            $(this).html(value);
        }
    });
}

/**
 * Switch to another language
 * 
 * @param {langCode}
 *            Code of language to switch to
 * @param {forceSwitch}
 *            force the language setting
 */
function switchLanguage(langCode, forceSwitch) {
    if (forceSwitch || userState.language != langCode) {
        var langs = [ 'DE', 'EN', 'FI', 'DA', 'ES' ];
        if (langs.indexOf(langCode) < 0) {
            langCode = "EN";
        }

        for (i = 0; i < langs.length; i++) {
            $('.' + langs[i] + '').css('display', 'none');
        }
        $('.' + langCode + '').css('display', 'inline');

        userState.language = langCode;
        var url = 'blockly/msg/js/' + langCode.toLowerCase() + '.js';
        var future = $.getScript(url);
        future.then(function(newLanguageScript) {
            switchLanguageInBlockly();
            UTIL.getBricklyFrame('#bricklyFrame').eval(newLanguageScript);
            UTIL.getBricklyFrame('#bricklyFrame').switchLanguageInBrickly();
        });
    }
}

/**
 * Switch blockly to another language
 */
function switchLanguageInBlockly() {
    translate();
    var programBlocks = null;
    if (Blockly.mainWorkspace !== null) {
        var xmlProgram = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
        programBlocks = Blockly.Xml.domToText(xmlProgram);
    }
    // translate programming tab
    loadToolbox(userState.toolbox);
    initProgramEnvironment(programBlocks);
}

/**
 * Initialize language switching
 */
function initializeLanguages() {
    var language;
    if (navigator.language.indexOf("de") > -1) {
        language = 'DE';
        $('#chosenLanguage').text('DE');
    } else if (navigator.language.indexOf("fi") > -1) {
        language = 'FI';
        $('#chosenLanguage').text('FI');
    } else if (navigator.language.indexOf("da") > -1) {
        language = 'DA';
        $('#chosenLanguage').text('DA');
    } else if (navigator.language.indexOf("es") > -1) {
        language = 'ES';
        $('#chosenLanguage').text('ES');
    } else {
        language = 'EN';
        $('#chosenLanguage').text('EN');
    }

    $('#language').on('click', '.dropdown-menu li a', function() {
        var chosenLanguage = $(this).text();
        $('#chosenLanguage').text(chosenLanguage);
        switchLanguage(chosenLanguage, false);
    });
    return language;
}

/**
 * Display information
 * 
 * @param {result}
 *            Response of a REST-call.
 * @param {successMessage}
 *            Toast-message to be displayed if REST-call was ok.
 * @param {result}
 *            Popup-message to be displayed if REST-call failed.
 * @param {messageParam}
 *            Parameter to be used in the message text.
 */
function displayInformation(result, successMessage, errorMessage, messageParam) {
    if (result.rc === "ok") {
        $('.modal').modal('hide'); // close all opened popups
        displayMessage(successMessage, "TOAST", messageParam);
    } else {
        displayMessage(errorMessage, "POPUP", messageParam);
    }
}

/**
 * Display message
 * 
 * @param {messageId}
 *            ID of message to be displayed
 * @param {output}
 *            where to display the message, "TOAST" or "POPUP"
 * @param {replaceWith}
 *            Text to replace an optional '$' in the message-text
 * 
 */
function displayMessage(messageId, output, replaceWith) {
    if (messageId != undefined) {
        if (messageId.indexOf(".") >= 0 || messageId.toUpperCase() != messageId) {
            // Invalid Message-Key 
            LOG.info('Invalid message-key received: ' + messageId);
        }

        var lkey = 'Blockly.Msg.' + messageId;
        var value = Blockly.Msg[messageId];
        if (value === undefined || value === '') {
            value = messageId;
        }
        if (value.indexOf("$") >= 0) {
            value = value.replace("$", replaceWith);
        }

        if (output === 'POPUP') {
            displayPopupMessage(lkey, value);
        } else if (output === 'TOAST') {
            toastMessages.unshift(value);
            if (toastMessages.length === 1) {
                displayToastMessages();
            }
        }
    }
}

/**
 * Display popup messages
 */
function displayPopupMessage(lkey, value) {
    $('#message').attr('lkey', lkey);
    $('#message').html(value);
    $("#show-message").modal("show");
}

/**
 * Display toast messages
 */
function displayToastMessages() {
    $('#toastText').text(toastMessages[toastMessages.length - 1]);
    $('#toastContainer').delay(100).fadeIn("slow", function() {
        $(this).delay(1000).fadeOut("slow", function() {
            toastMessages.pop();
            if (toastMessages.length > 0) {
                displayToastMessages();
            }
        });
    });
}

/**
 * Activate program and config menu when in frames that hides blockly/brickly.
 */
function activateProgConfigMenu() {
    $('#head-navigation-program-edit > ul > li').removeClass('disabled');
    $('#head-navigation-configuration-edit > ul > li').removeClass('disabled');
    setHeadNavigationMenuState(userState.id === -1 ? 'logout' : 'login');
    if (userState.programSaved) {
        $('#menuSaveProg').parent().removeClass('login');
        $('#menuSaveProg').parent().removeClass('disabled');
        Blockly.getMainWorkspace().saveButton.enable();
    }
    if (userState.configurationSaved) {
        $('#menuSaveConfig').parent().removeClass('login');
        $('#menuSaveConfig').parent().removeClass('disabled');
        UTIL.getBricklyFrame('#bricklyFrame').Blockly.getMainWorkspace().saveButton.enable();
    }
}
/**
 * Deactivate program and config menu.
 */
function deactivateProgConfigMenu() {
    $('#head-navigation-program-edit > ul > li').addClass('disabled');
    $('#head-navigation-configuration-edit > ul > li').addClass('disabled');
}

/**
 * Regularly ping the server to keep status information up-to-date
 */
function pingServer() {
    // if (userState.doPing) {
    COMM.ping(function(result) {
        setRobotState(result);
    });
    // }
}

/**
 * Handle server errors
 */
function handleServerErrors() {
    // TODO more?
    LOG.info('network changed');
}

/**
 * Set modification state.
 * 
 * @param {modified}
 *            modified or not.
 */
function setWorkspaceModified(modified) {
    userState.programModified = modified;
}

/**
 * Wait for all blocklies ready.
 * 
 */
function initBlockly() {
    if (userState.bricklyReady && userState.blocklyReady) {
        var language = initializeLanguages();
        switchLanguage(language, true);
    } else {
        setTimeout(function() {
            initBlockly();
        }, 100);
    }
}
/**
 * Wait for first translation.
 * 
 */
function startPopup() {
    if (userState.blocklyTranslated && userState.bricklyTranslated) {
        $("#show-startup-message").modal("show");
        //Pace.stop;
    } else {
        setTimeout(function() {
            startPopup();
        }, 100);
    }
}

function refreshBlocklyProgram(result) {
    var xml = Blockly.Xml.textToDom(result.data);
    Blockly.mainWorkspace.clear();
    Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);
}

/**
 * Initializations
 */
function init() {
    COMM.setErrorFn(handleServerErrors);
    initLogging();
    initUserState();
    $('#tabProgramName').text(userState.program);
    $('#tabConfigurationName').text(userState.configuration);
    initTabs();
    initPopups();
    initHeadNavigation();
    setHeadNavigationMenuState('logout');
    UTIL.initDataTables();
    initProgramNameTable();
    initConfigurationNameTable();
    initRelationsTable();

    $('#menuTabProgram').parent().addClass('disabled');
    $('#tabProgram').addClass('tabClicked');
    $('#head-navigation-configuration-edit').css('display', 'none');

    // Workaround to set the focus on input fields with attribute 'autofocus'
    $('.modal').on('shown.bs.modal', function() {
        $(this).find('[autofocus]').focus();
    });

    $(window).on('beforeunload', function(e) {
        if (userState.programModified || userState.configurationModified) {
            if (userState.id === -1) {
// Maybe a Firefox-Problem?                alert(Blockly.Msg['POPUP_BEFOREUNLOAD']);
                return Blockly.Msg.POPUP_BEFOREUNLOAD;
            } else {
// Maybe a Firefox-Problem?                alert(Blockly.Msg['POPUP_BEFOREUNLOAD_LOGGEDIN']);
                return Blöockly.Msg.POPUP_BEFOREUNLOAD_LOGGEDIN;
            }
        }
    });

    $('[rel="tooltip"]').tooltip({
        placement : "right"
    });

    UTIL.checkVisibility(function() {
        var visible = UTIL.checkVisibility();
        LOG.info("this tab visible: " + visible);
        if (!visible) {
            SIM.setPause(true);
            // TODO do more?
        }
    });
    initRobot();
    COMM.json("/toolbox", {
        "cmd" : "loadT",
        "name" : userState.toolbox,
        "owner" : " "
    }, function(result) {
        injectBlockly(result);
    });
    initBlockly();
    startPopup();

    var ping = setInterval(function() {
        pingServer()
    }, 5000);
}

$(document).ready(WRAP.fn3(init, 'page init'));
