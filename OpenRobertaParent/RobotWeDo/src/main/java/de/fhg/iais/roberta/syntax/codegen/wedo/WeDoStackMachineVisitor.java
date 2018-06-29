package de.fhg.iais.roberta.syntax.codegen.wedo;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.json.JSONObject;

import de.fhg.iais.roberta.components.UsedActor;
import de.fhg.iais.roberta.components.UsedConfigurationBlock;
import de.fhg.iais.roberta.components.UsedSensor;
import de.fhg.iais.roberta.components.wedo.WeDoConfiguration;
import de.fhg.iais.roberta.syntax.Phrase;
import de.fhg.iais.roberta.syntax.action.display.ClearDisplayAction;
import de.fhg.iais.roberta.syntax.action.display.ShowPictureAction;
import de.fhg.iais.roberta.syntax.action.display.ShowTextAction;
import de.fhg.iais.roberta.syntax.action.light.LedAction;
import de.fhg.iais.roberta.syntax.action.light.LightAction;
import de.fhg.iais.roberta.syntax.action.light.LightStatusAction;
import de.fhg.iais.roberta.syntax.action.motor.CurveAction;
import de.fhg.iais.roberta.syntax.action.motor.DriveAction;
import de.fhg.iais.roberta.syntax.action.motor.MotorDriveStopAction;
import de.fhg.iais.roberta.syntax.action.motor.MotorGetPowerAction;
import de.fhg.iais.roberta.syntax.action.motor.MotorOnAction;
import de.fhg.iais.roberta.syntax.action.motor.MotorSetPowerAction;
import de.fhg.iais.roberta.syntax.action.motor.MotorStopAction;
import de.fhg.iais.roberta.syntax.action.motor.TurnAction;
import de.fhg.iais.roberta.syntax.action.sound.PlayFileAction;
import de.fhg.iais.roberta.syntax.action.sound.SayTextAction;
import de.fhg.iais.roberta.syntax.action.sound.SetLanguageAction;
import de.fhg.iais.roberta.syntax.action.sound.VolumeAction;
import de.fhg.iais.roberta.syntax.action.wedo.LedOnAction;
import de.fhg.iais.roberta.syntax.check.hardware.wedo.UsedHardwareCollectorVisitor;
import de.fhg.iais.roberta.syntax.expr.wedo.LedColor;
import de.fhg.iais.roberta.syntax.lang.expr.VarDeclaration;
import de.fhg.iais.roberta.syntax.sensor.generic.BrickSensor;
import de.fhg.iais.roberta.syntax.sensor.generic.ColorSensor;
import de.fhg.iais.roberta.syntax.sensor.generic.GyroSensor;
import de.fhg.iais.roberta.syntax.sensor.generic.IRSeekerSensor;
import de.fhg.iais.roberta.syntax.sensor.generic.InfraredSensor;
import de.fhg.iais.roberta.syntax.sensor.generic.LightSensor;
import de.fhg.iais.roberta.syntax.sensor.generic.SoundSensor;
import de.fhg.iais.roberta.syntax.sensor.generic.TouchSensor;
import de.fhg.iais.roberta.syntax.sensor.generic.UltrasonicSensor;
import de.fhg.iais.roberta.util.dbc.Assert;
import de.fhg.iais.roberta.util.dbc.DbcException;
import de.fhg.iais.roberta.visitor.wedo.WeDoAstVisitor;

public class WeDoStackMachineVisitor<V> extends AbstractStackMachineVisitor<V> implements WeDoAstVisitor<V> {
    protected Set<UsedSensor> usedSensors;
    protected Set<UsedConfigurationBlock> usedConfigurationBlocks;
    protected Set<UsedActor> usedActors;
    protected ArrayList<VarDeclaration<Void>> usedVars;
    private final boolean isTimerSensorUsed;
    private final Map<Integer, Boolean> loopsLabels;

    private WeDoStackMachineVisitor(WeDoConfiguration brickConfiguration, ArrayList<ArrayList<Phrase<Void>>> phrases) {
        super(brickConfiguration);
        UsedHardwareCollectorVisitor codePreprocessVisitor = new UsedHardwareCollectorVisitor(phrases, brickConfiguration);
        this.usedVars = codePreprocessVisitor.getVisitedVars();
        this.usedConfigurationBlocks = codePreprocessVisitor.getUsedConfigurationBlocks();
        this.isTimerSensorUsed = codePreprocessVisitor.isTimerSensorUsed();
        this.loopsLabels = codePreprocessVisitor.getloopsLabelContainer();
    }

    public static String generate(WeDoConfiguration brickConfiguration, ArrayList<ArrayList<Phrase<Void>>> phrasesSet) {
        Assert.isTrue(!phrasesSet.isEmpty());
        Assert.notNull(brickConfiguration);

        WeDoStackMachineVisitor<Void> astVisitor = new WeDoStackMachineVisitor<>(brickConfiguration, phrasesSet);
        astVisitor.generateCodeFromPhrases(phrasesSet);
        return astVisitor.opArray.toString();
    }

    @Override
    public V visitDriveAction(DriveAction<V> driveAction) {
        throw new DbcException("operation not supported");
    }

    @Override
    public V visitCurveAction(CurveAction<V> curveAction) {
        throw new DbcException("operation not supported");
    }

    @Override
    public V visitTurnAction(TurnAction<V> turnAction) {
        throw new DbcException("operation not supported");
    }

    @Override
    public V visitLightAction(LightAction<V> lightAction) {
        JSONObject o = mk(C.TURN_LIGHT).put(C.COLOR, lightAction.getColor()).put(C.MODE, lightAction.getBlinkMode());
        return app(o);
    }

    @Override
    public V visitLightStatusAction(LightStatusAction<V> lightStatusAction) {
        JSONObject o = mk(C.STATUS_LIGHT_ACTION).put(C.MODE, LightStatusAction.Status.OFF);
        return app(o);
    }

    @Override
    public V visitMotorOnAction(MotorOnAction<V> motorOnAction) {
        boolean isDuration = motorOnAction.getParam().getDuration() != null;
        String actorName = motorOnAction.getPort().getOraName();
        UsedConfigurationBlock confMotorBlock = getConfigurationBlock(actorName);
        if ( confMotorBlock == null ) {
            throw new DbcException("no motor declared in the configuration");
        }
        String brickName = confMotorBlock.getPins().size() >= 1 ? confMotorBlock.getPins().get(0) : null;
        String port = confMotorBlock.getPins().size() >= 2 ? confMotorBlock.getPins().get(1) : null;
        JSONObject o;
        if ( (brickName != null) && (port != null) ) {
            motorOnAction.getParam().getSpeed().visit(this);
            o = mk(C.MOTOR_ON_ACTION).put(C.NAME, brickName).put(C.PORT, port);
            if ( isDuration ) {
                pushOpArray();
                motorOnAction.getParam().getDuration().getValue().visit(this);
                this.opArray.add(mk(C.DURATION).put(C.EXPR, C.TIME));
                List<JSONObject> duration = popOpArray();
                o.put(C.DURATION, duration);
            }
        } else {
            o = mk(C.NULL_CONST);
        }
        return app(o);
    }

    @Override
    public V visitMotorStopAction(MotorStopAction<V> motorStopAction) {
        JSONObject o = mk(C.MOTOR_STOP);
        return app(o);
    }

    @Override
    public V visitClearDisplayAction(ClearDisplayAction<V> clearDisplayAction) {
        JSONObject o = mk(C.CLEAR_DISPLAY_ACTION);
        return app(o);
    }

    @Override
    public V visitVolumeAction(VolumeAction<V> volumeAction) {
        throw new DbcException("operation not supported");
    }

    @Override
    public V visitSetLanguageAction(SetLanguageAction<V> setLanguageAction) {
        throw new DbcException("operation not supported");
    }

    @Override
    public V visitSayTextAction(SayTextAction<V> sayTextAction) {
        throw new DbcException("operation not supported");
    }

    @Override
    public V visitPlayFileAction(PlayFileAction<V> playFileAction) {
        throw new DbcException("operation not supported");
    }

    @Override
    public V visitShowPictureAction(ShowPictureAction<V> showPictureAction) {
        throw new DbcException("operation not supported");
    }

    @Override
    public V visitShowTextAction(ShowTextAction<V> showTextAction) {
        showTextAction.getMsg().visit(this);
        JSONObject o = mk(C.SHOW_TEXT_ACTION);
        return app(o);
    }

    @Override
    public V visitMotorDriveStopAction(MotorDriveStopAction<V> stopAction) {
        throw new DbcException("operation not supported");
    }

    @Override
    public V visitBrickSensor(BrickSensor<V> brickSensor) {
        JSONObject o = mk(C.GET_SAMPLE).put(C.GET_SAMPLE, C.BUTTONS).put(C.PORT, brickSensor.getPort());
        return app(o);
    }

    @Override
    public V visitColorSensor(ColorSensor<V> colorSensor) {
        throw new DbcException("operation not supported");
    }

    @Override
    public V visitLightSensor(LightSensor<V> lightSensor) {
        throw new DbcException("operation not supported");
    }

    @Override
    public V visitGyroSensor(GyroSensor<V> gyroSensor) {
        String sensorName = gyroSensor.getPort().getOraName();
        UsedConfigurationBlock confGyroSensor = getConfigurationBlock(sensorName);
        if ( confGyroSensor == null ) {
            throw new DbcException("no gyro sensor declared in the configuration");
        }
        String brickName = confGyroSensor.getPins().size() >= 1 ? confGyroSensor.getPins().get(0) : null;
        String port = confGyroSensor.getPins().size() >= 2 ? confGyroSensor.getPins().get(1) : null;
        String slot = gyroSensor.getSlot().toString();
        if ( (brickName != null) && (port != null) ) {
            JSONObject o = mk(C.GET_SAMPLE).put(C.GET_SAMPLE, C.GYRO).put(C.NAME, brickName).put(C.PORT, port).put(C.SLOT, slot);
            return app(o);
        } else {
            throw new DbcException("operation not supported");
        }
    }

    @Override
    public V visitInfraredSensor(InfraredSensor<V> infraredSensor) {
        String sensorName = infraredSensor.getPort().getOraName();
        UsedConfigurationBlock confInfraredSensor = getConfigurationBlock(sensorName);
        if ( confInfraredSensor == null ) {
            throw new DbcException("no infrared sensor declared in the configuration");
        }
        String brickName = confInfraredSensor.getPins().size() >= 1 ? confInfraredSensor.getPins().get(0) : null;
        String port = confInfraredSensor.getPins().size() >= 2 ? confInfraredSensor.getPins().get(1) : null;
        JSONObject o;
        if ( (brickName != null) && (port != null) ) {
            o = mk(C.GET_SAMPLE).put(C.GET_SAMPLE, C.INFRARED).put(C.NAME, brickName).put(C.PORT, port);
        } else {
            o = mk(C.NULL_CONST);
        }
        return app(o);
    }

    @Override
    public V visitIRSeekerSensor(IRSeekerSensor<V> irSeekerSensor) {
        throw new DbcException("operation not supported");
    }

    @Override
    public V visitTouchSensor(TouchSensor<V> touchSensor) {
        throw new DbcException("operation not supported");
    }

    @Override
    public V visitUltrasonicSensor(UltrasonicSensor<V> ultrasonicSensor) {
        throw new DbcException("operation not supported");
    }

    @Override
    public V visitSoundSensor(SoundSensor<V> soundSensor) {
        throw new DbcException("operation not supported");
    }

    @Override
    public V visitLedAction(LedAction<V> ledAction) {
        throw new DbcException("operation not supported");
    }

    @Override
    public V visitMotorGetPowerAction(MotorGetPowerAction<V> motorGetPowerAction) {
        throw new DbcException("operation not supported");
    }

    @Override
    public V visitMotorSetPowerAction(MotorSetPowerAction<V> motorSetPowerAction) {
        throw new DbcException("operation not supported");
    }

    UsedConfigurationBlock getConfigurationBlock(String name) {
        for ( UsedConfigurationBlock usedConfigurationBlock : this.usedConfigurationBlocks ) {
            if ( usedConfigurationBlock.getBlockName().equals(name) ) {
                return usedConfigurationBlock;
            }
        }
        return null;
    }

    @Override
    public V visitLedColor(LedColor<V> ledColor) {
        int[] colors = {
            ledColor.getRedChannel(),
            ledColor.getGreenChannel(),
            ledColor.getBlueChannel()
        };
        JSONObject o = mk(C.EXPR).put(C.EXPR, ledColor.getKind().getName()).put(C.VALUE, colors);
        return app(o);
    }

    @Override
    public V visitLedOnAction(LedOnAction<V> ledOnAction) {
        ledOnAction.getLedColor().visit(this);
        JSONObject o = mk(C.LED_ON_ACTION);
        return app(o);
    }
}