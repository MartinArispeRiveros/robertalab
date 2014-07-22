package de.fhg.iais.roberta.ast.transformer;

import java.util.ArrayList;
import java.util.List;

import de.fhg.iais.roberta.ast.funct.Funct;
import de.fhg.iais.roberta.ast.funct.Funct.Function;
import de.fhg.iais.roberta.ast.syntax.Phrase;
import de.fhg.iais.roberta.ast.syntax.Phrase.Category;
import de.fhg.iais.roberta.ast.syntax.action.Action;
import de.fhg.iais.roberta.ast.syntax.action.ActorPort;
import de.fhg.iais.roberta.ast.syntax.action.ClearDisplayAction;
import de.fhg.iais.roberta.ast.syntax.action.DriveAction;
import de.fhg.iais.roberta.ast.syntax.action.LightAction;
import de.fhg.iais.roberta.ast.syntax.action.LightStatusAction;
import de.fhg.iais.roberta.ast.syntax.action.MotionParam;
import de.fhg.iais.roberta.ast.syntax.action.MotorDuration;
import de.fhg.iais.roberta.ast.syntax.action.MotorGetPowerAction;
import de.fhg.iais.roberta.ast.syntax.action.MotorOnAction;
import de.fhg.iais.roberta.ast.syntax.action.MotorStopAction;
import de.fhg.iais.roberta.ast.syntax.action.MotorStopMode;
import de.fhg.iais.roberta.ast.syntax.action.PlayFileAction;
import de.fhg.iais.roberta.ast.syntax.action.ShowPictureAction;
import de.fhg.iais.roberta.ast.syntax.action.ShowTextAction;
import de.fhg.iais.roberta.ast.syntax.action.StopAction;
import de.fhg.iais.roberta.ast.syntax.action.ToneAction;
import de.fhg.iais.roberta.ast.syntax.action.TurnAction;
import de.fhg.iais.roberta.ast.syntax.action.VolumeAction;
import de.fhg.iais.roberta.ast.syntax.expr.ActionExpr;
import de.fhg.iais.roberta.ast.syntax.expr.Binary;
import de.fhg.iais.roberta.ast.syntax.expr.BoolConst;
import de.fhg.iais.roberta.ast.syntax.expr.ColorConst;
import de.fhg.iais.roberta.ast.syntax.expr.EmptyExpr;
import de.fhg.iais.roberta.ast.syntax.expr.Expr;
import de.fhg.iais.roberta.ast.syntax.expr.ExprList;
import de.fhg.iais.roberta.ast.syntax.expr.MathConst;
import de.fhg.iais.roberta.ast.syntax.expr.NullConst;
import de.fhg.iais.roberta.ast.syntax.expr.NumConst;
import de.fhg.iais.roberta.ast.syntax.expr.SensorExpr;
import de.fhg.iais.roberta.ast.syntax.expr.StringConst;
import de.fhg.iais.roberta.ast.syntax.expr.Unary;
import de.fhg.iais.roberta.ast.syntax.expr.Var;
import de.fhg.iais.roberta.ast.syntax.sensor.BrickKey;
import de.fhg.iais.roberta.ast.syntax.sensor.BrickSensor;
import de.fhg.iais.roberta.ast.syntax.sensor.ColorSensor;
import de.fhg.iais.roberta.ast.syntax.sensor.DrehSensor;
import de.fhg.iais.roberta.ast.syntax.sensor.GyroSensor;
import de.fhg.iais.roberta.ast.syntax.sensor.InfraredSensor;
import de.fhg.iais.roberta.ast.syntax.sensor.Sensor;
import de.fhg.iais.roberta.ast.syntax.sensor.SensorPort;
import de.fhg.iais.roberta.ast.syntax.sensor.TimerSensor;
import de.fhg.iais.roberta.ast.syntax.sensor.TouchSensor;
import de.fhg.iais.roberta.ast.syntax.sensor.UltraSSensor;
import de.fhg.iais.roberta.ast.syntax.stmt.ActionStmt;
import de.fhg.iais.roberta.ast.syntax.stmt.AssignStmt;
import de.fhg.iais.roberta.ast.syntax.stmt.ExprStmt;
import de.fhg.iais.roberta.ast.syntax.stmt.IfStmt;
import de.fhg.iais.roberta.ast.syntax.stmt.RepeatStmt;
import de.fhg.iais.roberta.ast.syntax.stmt.SensorStmt;
import de.fhg.iais.roberta.ast.syntax.stmt.Stmt;
import de.fhg.iais.roberta.ast.syntax.stmt.StmtFlowCon;
import de.fhg.iais.roberta.ast.syntax.stmt.StmtFlowCon.Flow;
import de.fhg.iais.roberta.ast.syntax.stmt.StmtList;
import de.fhg.iais.roberta.blockly.generated.Block;
import de.fhg.iais.roberta.blockly.generated.Field;
import de.fhg.iais.roberta.blockly.generated.Instance;
import de.fhg.iais.roberta.blockly.generated.Mutation;
import de.fhg.iais.roberta.blockly.generated.Project;
import de.fhg.iais.roberta.blockly.generated.Statement;
import de.fhg.iais.roberta.blockly.generated.Value;
import de.fhg.iais.roberta.dbc.Assert;

/**
 * JAXB to AST transformer. Client should provide tree of jaxb objects.
 * 
 * @author kcvejoski
 */
public class JaxbTransformer {
    private final List<ArrayList<Phrase>> project = new ArrayList<ArrayList<Phrase>>();

    /**
     * Converts object of type {@link Project} to AST tree.
     * 
     * @param pr
     */
    public void projectToAST(Project pr) {
        List<Instance> instances = pr.getInstance();
        for ( Instance instance : instances ) {
            this.project.add(instanceToAST(instance));
        }
    }

    private ArrayList<Phrase> instanceToAST(Instance instance) {
        List<Block> blocks = instance.getBlock();
        ArrayList<Phrase> phrases = new ArrayList<Phrase>();
        for ( Block block : blocks ) {
            phrases.add(bToA(block));
        }
        return phrases;
    }

    public List<ArrayList<Phrase>> getProject() {
        return this.project;
    }

    private Phrase bToA(Block block) {

        List<Value> values;
        List<Field> fields;
        List<ExprParam> exprParams;

        ExprList exprList;

        Phrase left;
        Phrase right;
        Phrase expr;
        Phrase var;

        String mode;
        String port;

        MotionParam mp;
        MotorDuration md;

        switch ( block.getType() ) {
        //ACTION
            case "robActions_motor_on":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "MOTORPORT", (short) 0);
                values = extractValues(block, (short) 1);
                expr = extractValue(values, new ExprParam("POWER", Integer.class));
                mp = new MotionParam.Builder().speed((Expr) expr).build();
                return MotorOnAction.make(ActorPort.get(port), mp);

            case "robActions_motor_on_for":
                fields = extractFields(block, (short) 2);
                port = extractField(fields, "MOTORPORT", (short) 0);
                mode = extractField(fields, "MOTORROTATION", (short) 1);
                values = extractValues(block, (short) 2);
                left = extractValue(values, new ExprParam("POWER", Integer.class));
                right = extractValue(values, new ExprParam("VALUE", Integer.class));
                md = new MotorDuration(MotorDuration.Mode.get(mode), (Expr) right);
                mp = new MotionParam.Builder().speed((Expr) left).duration(md).build();
                return MotorOnAction.make(ActorPort.get(port), mp);

            case "robActions_motorDiff_on":
                fields = extractFields(block, (short) 1);
                mode = extractField(fields, "DIRECTION", (short) 0);
                values = extractValues(block, (short) 1);
                expr = extractValue(values, new ExprParam("POWER", Integer.class));
                mp = new MotionParam.Builder().speed((Expr) expr).build();
                return DriveAction.make(DriveAction.Direction.get(mode), mp);

            case "robActions_motorDiff_on_for":
                fields = extractFields(block, (short) 1);
                mode = extractField(fields, "DIRECTION", (short) 0);
                values = extractValues(block, (short) 2);
                left = extractValue(values, new ExprParam("POWER", Integer.class));
                right = extractValue(values, new ExprParam("DISTANCE", Integer.class));
                md = new MotorDuration(MotorDuration.Mode.DISTANCE, (Expr) right);
                mp = new MotionParam.Builder().speed((Expr) left).duration(md).build();
                return DriveAction.make(DriveAction.Direction.get(mode), mp);

            case "robActions_motorDiff_turn":
                fields = extractFields(block, (short) 1);
                mode = extractField(fields, "DIRECTION", (short) 0);
                values = extractValues(block, (short) 1);
                expr = extractValue(values, new ExprParam("POWER", Integer.class));
                mp = new MotionParam.Builder().speed((Expr) expr).build();
                return TurnAction.make(TurnAction.Direction.get(mode), mp);

            case "robActions_motorDiff_turn_for":
                fields = extractFields(block, (short) 1);
                mode = extractField(fields, "DIRECTION", (short) 0);
                values = extractValues(block, (short) 2);
                left = extractValue(values, new ExprParam("POWER", Integer.class));
                right = extractValue(values, new ExprParam("DISTANCE", Integer.class));
                md = new MotorDuration(MotorDuration.Mode.DISTANCE, (Expr) right);
                mp = new MotionParam.Builder().speed((Expr) left).duration(md).build();
                return TurnAction.make(TurnAction.Direction.get(mode), mp);

            case "robActions_motorDiff_stop":
                return StopAction.make();

            case "robActions_motor_getPower":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "MOTORPORT", (short) 0);
                return MotorGetPowerAction.make(ActorPort.get(port));

            case "robActions_motor_stop":
                fields = extractFields(block, (short) 2);
                port = extractField(fields, "MOTORPORT", (short) 0);
                mode = extractField(fields, "MODE", (short) 1);
                return MotorStopAction.make(ActorPort.get(port), MotorStopMode.get(mode));

            case "robActions_display_text":
                values = extractValues(block, (short) 3);
                Phrase msg = extractValue(values, new ExprParam("OUT", String.class));
                Phrase col = extractValue(values, new ExprParam("COL", Integer.class));
                Phrase row = extractValue(values, new ExprParam("ROW", Integer.class));
                return ShowTextAction.make((Expr) msg, (Expr) col, (Expr) row);

            case "robActions_display_picture":
                fields = extractFields(block, (short) 1);
                values = extractValues(block, (short) 2);
                String pic = extractField(fields, "PICTURE", (short) 0);
                Phrase x = extractValue(values, new ExprParam("X", Integer.class));
                Phrase y = extractValue(values, new ExprParam("Y", Integer.class));
                return ShowPictureAction.make(pic, (Expr) x, (Expr) y);

            case "robActions_display_clear":
                return ClearDisplayAction.make();

            case "robActions_play_tone":
                values = extractValues(block, (short) 2);
                left = extractValue(values, new ExprParam("FREQUENCE", Integer.class));
                right = extractValue(values, new ExprParam("DURATION", Integer.class));
                return ToneAction.make((Expr) left, (Expr) right);

            case "robActions_play_file":
                fields = extractFields(block, (short) 1);
                String filename = extractField(fields, "FILE", (short) 0);
                return PlayFileAction.make(filename);

            case "robActions_play_setVolume":
                values = extractValues(block, (short) 1);
                expr = extractValue(values, new ExprParam("VOLUME", Integer.class));
                return VolumeAction.make(VolumeAction.Mode.SET, (Expr) expr);

            case "robActions_play_getVolume":
                expr = NullConst.make();
                return VolumeAction.make(VolumeAction.Mode.GET, (Expr) expr);

            case "robActions_brickLight_on":
                fields = extractFields(block, (short) 2);
                String color = extractField(fields, "SWITCH_COLOR", (short) 0);
                String blink = extractField(fields, "SWITCH_BLINK", (short) 1);
                return LightAction.make(LightAction.Color.get(color), Boolean.valueOf(blink));

            case "robActions_brickLight_off":
                return LightStatusAction.make(LightStatusAction.Status.OFF);

            case "robActions_brickLight_reset":
                return LightStatusAction.make(LightStatusAction.Status.RESET);

                //Sensoren
            case "robSensors_touch_isPressed":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "SENSORPORT", (short) 0);
                return TouchSensor.make(SensorPort.get(port));

            case "robSensors_ultrasonic_setMode":
                fields = extractFields(block, (short) 2);
                port = extractField(fields, "SENSORPORT", (short) 0);
                mode = extractField(fields, "MODE", (short) 1);
                return UltraSSensor.make(UltraSSensor.Mode.get(mode), SensorPort.get(port));

            case "robSensors_ultrasonic_getMode":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "SENSORPORT", (short) 0);
                return UltraSSensor.make(UltraSSensor.Mode.GET_MODE, SensorPort.get(port));

            case "robSensors_ultrasonic_getSample":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "SENSORPORT", (short) 0);
                return UltraSSensor.make(UltraSSensor.Mode.GET_SAMPLE, SensorPort.get(port));

            case "robSensors_colour_setMode":
                fields = extractFields(block, (short) 2);
                port = extractField(fields, "SENSORPORT", (short) 0);
                mode = extractField(fields, "MODE", (short) 1);
                return ColorSensor.make(ColorSensor.Mode.get(mode), SensorPort.get(port));

            case "robSensors_colour_getMode":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "SENSORPORT", (short) 0);
                return ColorSensor.make(ColorSensor.Mode.GET_MODE, SensorPort.get(port));

            case "robSensors_colour_getSample":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "SENSORPORT", (short) 0);
                return ColorSensor.make(ColorSensor.Mode.GET_SAMPLE, SensorPort.get(port));

            case "robSensors_infrared_setMode":
                fields = extractFields(block, (short) 2);
                port = extractField(fields, "SENSORPORT", (short) 0);
                mode = extractField(fields, "MODE", (short) 1);
                return InfraredSensor.make(InfraredSensor.Mode.get(mode), SensorPort.get(port));

            case "robSensors_infrared_getMode":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "SENSORPORT", (short) 0);
                return InfraredSensor.make(InfraredSensor.Mode.GET_MODE, SensorPort.get(port));

            case "robSensors_infrared_getSample":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "SENSORPORT", (short) 0);
                return InfraredSensor.make(InfraredSensor.Mode.GET_SAMPLE, SensorPort.get(port));

            case "robSensors_encoder_setMode":
                fields = extractFields(block, (short) 2);
                port = extractField(fields, "MOTORPORT", (short) 0);
                mode = extractField(fields, "MODE", (short) 1);
                return DrehSensor.make(DrehSensor.Mode.get(mode), ActorPort.get(port));

            case "robSensors_encoder_getMode":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "MOTORPORT", (short) 0);
                return DrehSensor.make(DrehSensor.Mode.GET_MODE, ActorPort.get(port));

            case "robSensors_encoder_getSample":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "MOTORPORT", (short) 0);
                return DrehSensor.make(DrehSensor.Mode.GET_SAMPLE, ActorPort.get(port));

            case "robSensors_encoder_reset":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "MOTORPORT", (short) 0);
                return DrehSensor.make(DrehSensor.Mode.RESET, ActorPort.get(port));

            case "robSensors_key_isPressed":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "KEY", (short) 0);
                return BrickSensor.make(BrickSensor.Mode.IS_PRESSED, BrickKey.get(port));

            case "robSensors_key_waitForPress":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "KEY", (short) 0);
                return BrickSensor.make(BrickSensor.Mode.WAIT_FOR_PRESS, BrickKey.get(port));

            case "robSensors_key_isPressedAndReleased":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "KEY", (short) 0);
                return BrickSensor.make(BrickSensor.Mode.WAIT_FOR_PRESS_AND_RELEASE, BrickKey.get(port));

            case "robSensors_gyro_setMode":
                fields = extractFields(block, (short) 2);
                port = extractField(fields, "SENSORPORT", (short) 0);
                mode = extractField(fields, "MODE", (short) 1);
                return GyroSensor.make(GyroSensor.Mode.get(mode), SensorPort.get(port));

            case "robSensors_gyro_getMode":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "SENSORPORT", (short) 0);
                return GyroSensor.make(GyroSensor.Mode.GET_MODE, SensorPort.get(port));

            case "robSensors_gyro_getSample":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "SENSORPORT", (short) 0);
                return GyroSensor.make(GyroSensor.Mode.GET_SAMPLE, SensorPort.get(port));

            case "robSensors_gyro_reset":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "SENSORPORT", (short) 0);
                return GyroSensor.make(GyroSensor.Mode.RESET, SensorPort.get(port));

            case "robSensors_timer_getSample":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "SENSORNUM", (short) 0);
                return TimerSensor.make(TimerSensor.Mode.GET_SAMPLE, Integer.valueOf(port));

            case "robSensors_timer_reset":
                fields = extractFields(block, (short) 1);
                port = extractField(fields, "SENSORNUM", (short) 0);
                return TimerSensor.make(TimerSensor.Mode.RESET, Integer.valueOf(port));

                //Logik
            case "logic_compare":
                return blockToBinaryExpr(block, new ExprParam("A", Integer.class), new ExprParam("B", Integer.class), "OP");

            case "logic_operation":
                return blockToBinaryExpr(block, new ExprParam("A", Boolean.class), new ExprParam("B", Boolean.class), "OP");

            case "logic_negate":
                return blockToUnaryExpr(block, new ExprParam("BOOL", Boolean.class), "NOT");

            case "logic_boolean":
                return blockToConst(block, "BOOL");

            case "logic_null":
                return NullConst.make();

            case "logic_ternary":
                values = block.getValue();
                Assert.isTrue(values.size() <= 3, "Number of values is not less or equal to 3!");
                Phrase ifExpr = extractValue(values, new ExprParam("IF", Boolean.class));
                Phrase thenStmt = extractValue(values, new ExprParam("THEN", Stmt.class));
                Phrase elseStmt = extractValue(values, new ExprParam("ELSE", Stmt.class));
                StmtList thenList = StmtList.make();
                thenList.addStmt(ExprStmt.make((Expr) thenStmt));
                thenList.setReadOnly();
                StmtList elseList = StmtList.make();
                elseList.addStmt(ExprStmt.make((Expr) elseStmt));
                elseList.setReadOnly();
                return IfStmt.make((Expr) ifExpr, thenList, elseList);

                //Mathematik
            case "math_number":
                return blockToConst(block, "NUM");

            case "math_arithmetic":
                if ( getOperation(block, "OP").equals("POWER") ) {
                    exprParams = new ArrayList<ExprParam>();
                    exprParams.add(new ExprParam("A", Integer.class));
                    exprParams.add(new ExprParam("B", Integer.class));
                    return blockToFunction(block, exprParams, "OP");
                } else {
                    return blockToBinaryExpr(block, new ExprParam("A", Integer.class), new ExprParam("B", Integer.class), "OP");
                }

            case "math_single":
                if ( getOperation(block, "OP").equals("NEG") ) {
                    return blockToUnaryExpr(block, new ExprParam("NUM", Integer.class), "OP");
                } else {
                    exprParams = new ArrayList<ExprParam>();
                    exprParams.add(new ExprParam("NUM", Integer.class));
                    return blockToFunction(block, exprParams, "OP");
                }

            case "math_trig":
                exprParams = new ArrayList<ExprParam>();
                exprParams.add(new ExprParam("NUM", Integer.class));
                return blockToFunction(block, exprParams, "OP");

            case "math_constant":
                return blockToConst(block, "CONSTANT");

            case "math_number_property":
                boolean divisorInput = block.getMutation().isDivisorInput();
                String op = extractOperation(block, "PROPERTY");
                if ( op.equals("DIVISIBLE_BY") ) {
                    Assert.isTrue(divisorInput, "Divisor input is not equal to true!");
                    exprParams = new ArrayList<ExprParam>();
                    exprParams.add(new ExprParam("NUMBER_TO_CHECK", Integer.class));
                    exprParams.add(new ExprParam("DIVISOR", Integer.class));
                    return blockToFunction(block, exprParams, "PROPERTY");
                } else {
                    Assert.isTrue(!divisorInput, "Divisor input is not equal to false!");
                    exprParams = new ArrayList<ExprParam>();
                    exprParams.add(new ExprParam("NUMBER_TO_CHECK", Integer.class));
                    return blockToFunction(block, exprParams, "PROPERTY");
                }

            case "math_change":
                values = extractValues(block, (short) 1);
                left = extractVar(block);
                right = extractValue(values, new ExprParam("DELTA", Integer.class));
                return Binary.make(Binary.Op.MATH_CHANGE, (Expr) left, (Expr) right);

            case "math_round":
                exprParams = new ArrayList<ExprParam>();
                exprParams.add(new ExprParam("NUM", Integer.class));
                return blockToFunction(block, exprParams, "OP");

            case "math_on_list":
                exprParams = new ArrayList<ExprParam>();
                exprParams.add(new ExprParam("LIST", ArrayList.class));
                return blockToFunction(block, exprParams, "OP");

            case "math_modulo":
                return blockToBinaryExpr(block, new ExprParam("DIVIDEND", Integer.class), new ExprParam("DIVISOR", Integer.class), "MOD");

            case "math_constrain":
                exprParams = new ArrayList<ExprParam>();
                exprParams.add(new ExprParam("VALUE", Integer.class));
                exprParams.add(new ExprParam("LOW", Integer.class));
                exprParams.add(new ExprParam("HIGH", Integer.class));
                return blockToFunction(block, exprParams, "CONSTRAIN");

            case "math_random_int":
                exprParams = new ArrayList<ExprParam>();
                exprParams.add(new ExprParam("FROM", Integer.class));
                exprParams.add(new ExprParam("TO", Integer.class));
                return blockToFunction(block, exprParams, "RANDOM_INTEGER");

            case "math_random_float":
                exprParams = new ArrayList<ExprParam>();
                return blockToFunction(block, exprParams, "RANDOM");

                //TEXT
            case "text":
                return blockToConst(block, "TEXT");

            case "text_join":
                exprList = blockToExprList(block, String.class);
                List<Expr> textList = new ArrayList<Expr>();
                textList.add(exprList);
                return Funct.make(Function.TEXT_JOIN, textList);

            case "text_append":
                values = extractValues(block, (short) 1);
                left = extractVar(block);
                right = extractValue(values, new ExprParam("TEXT", String.class));
                return Binary.make(Binary.Op.TEXT_APPEND, (Expr) left, (Expr) right);

            case "text_length":
                exprParams = new ArrayList<ExprParam>();
                exprParams.add(new ExprParam("VALUE", String.class));
                return blockToFunction(block, exprParams, "TEXT_LENGTH");

            case "text_isEmpty":
                exprParams = new ArrayList<ExprParam>();
                exprParams.add(new ExprParam("VALUE", String.class));
                return blockToFunction(block, exprParams, "IS_EMPTY");

            case "text_indexOf":
                exprParams = new ArrayList<ExprParam>();
                exprParams.add(new ExprParam("VALUE", String.class));
                exprParams.add(new ExprParam("FIND", String.class));
                return blockToFunction(block, exprParams, "END");

            case "text_charAt":
                boolean atArg = block.getMutation().isAt();
                exprParams = new ArrayList<ExprParam>();
                exprParams.add(new ExprParam("VALUE", String.class));
                if ( atArg == true ) {
                    exprParams.add(new ExprParam("AT", Integer.class));
                }
                return blockToFunction(block, exprParams, "WHERE");

            case "text_getSubstring":
                //TODO Not finished yet
                boolean atArg1 = block.getMutation().isAt1();
                boolean atArg2 = block.getMutation().isAt2();
                fields = extractFields(block, (short) 2);
                //                String where1 = extractField(fields, "WHERE1", (short) 0);
                //                String where2 = extractField(fields, "WHERE2", (short) 1);
                exprParams = new ArrayList<ExprParam>();
                exprParams.add(new ExprParam("STRING", String.class));
                if ( atArg1 == true ) {
                    exprParams.add(new ExprParam("AT", Integer.class));
                }
                if ( atArg2 == true ) {
                    exprParams.add(new ExprParam("AT", Integer.class));
                }
                return blockToFunction(block, exprParams, "SUBSTRING");

            case "text_changeCase":
                exprParams = new ArrayList<ExprParam>();
                exprParams.add(new ExprParam("TEXT", String.class));
                return blockToFunction(block, exprParams, "CASE");

            case "text_trim":
                exprParams = new ArrayList<ExprParam>();
                exprParams.add(new ExprParam("TEXT", String.class));
                return blockToFunction(block, exprParams, "MODE");

            case "text_prompt":
                List<Expr> lstExpr = new ArrayList<Expr>();
                fields = extractFields(block, (short) 2);
                String type = extractField(fields, "TYPE", (short) 0);
                String text = extractField(fields, "TEXT", (short) 1);
                StringConst txtExpr = StringConst.make(text);
                lstExpr.add(txtExpr);
                return Funct.make(Function.get(type), lstExpr);

            case "text_print":
                exprParams = new ArrayList<ExprParam>();
                exprParams.add(new ExprParam("TEXT", String.class));
                return blockToFunction(block, exprParams, "PRINT");

                //LISTEN
            case "lists_create_empty":
                return EmptyExpr.make(List.class);

            case "lists_create_with":
                return blockToExprList(block, ArrayList.class);

            case "lists_repeat":
                exprParams = new ArrayList<ExprParam>();
                exprParams.add(new ExprParam("ITEM", List.class));
                exprParams.add(new ExprParam("NUM", Integer.class));
                return blockToFunction(block, exprParams, "LISTS_REPEAT");

            case "lists_length":
                exprParams = new ArrayList<ExprParam>();
                exprParams.add(new ExprParam("VALUE", List.class));
                return blockToFunction(block, exprParams, "LISTS_LENGTH");

            case "lists_isEmpty":
                exprParams = new ArrayList<ExprParam>();
                exprParams.add(new ExprParam("VALUE", ArrayList.class));
                return blockToFunction(block, exprParams, "IS_EMPTY");

            case "lists_indexOf":
                exprParams = new ArrayList<ExprParam>();
                exprParams.add(new ExprParam("VALUE", List.class));
                exprParams.add(new ExprParam("FIND", List.class));
                return blockToFunction(block, exprParams, "END");

            case "lists_getIndex":
                //TODO not implemented

            case "lists_setIndex":
                //TODO not implemented

            case "lists_getSublist":
                //TODO not implemented

            case "robColour_picker":
                return blockToConst(block, "COLOUR");

                //VARIABLEN
            case "variables_set":
                values = extractValues(block, (short) 1);
                Phrase p = extractValue(values, new ExprParam("VALUE", EmptyExpr.class));
                expr = convertPhraseToExpr(p);
                return AssignStmt.make((Var) extractVar(block), (Expr) expr);

            case "variables_get":
                return extractVar(block);

                //KONTROLLE
            case "controls_if":
            case "robControls_if":
            case "robControls_ifElse":
                int _else = 0;
                int _elseIf = 0;
                if ( block.getMutation() == null ) {
                    return blocksToIfStmt(block, _else, _elseIf);
                } else {
                    Mutation mutation = block.getMutation();
                    if ( mutation.getElse() != null ) {
                        _else = mutation.getElse().intValue();
                    }
                    if ( mutation.getElseif() != null ) {
                        _elseIf = mutation.getElseif().intValue();
                        return blocksToIfStmt(block, _else, _elseIf);
                    }
                    return blocksToIfStmt(block, _else, _elseIf);
                }

            case "robControls_wait":
                StmtList list = StmtList.make();
                int mutation = block.getMutation().getWait().intValue();
                values = extractValues(block, (short) (mutation + 1));
                for ( int i = 0; i <= mutation; i++ ) {
                    expr = extractValue(values, new ExprParam("WAIT" + i, Boolean.class));
                    list.addStmt((Stmt) extractRepeatStatement(block, expr, "WHILE", "DO" + i, mutation + 1));
                }
                return list;

            case "robControls_wait_for":
                //TODO

            case "controls_whileUntil":
                fields = extractFields(block, (short) 1);
                mode = extractField(fields, "MODE", (short) 0);
                values = extractValues(block, (short) 1);
                expr = extractValue(values, new ExprParam("BOOL", Boolean.class));
                return extractRepeatStatement(block, expr, mode);

            case "controls_for":
                var = extractVar(block);
                values = extractValues(block, (short) 3);
                exprList = ExprList.make();

                Phrase from = extractValue(values, new ExprParam("FROM", Integer.class));
                Phrase to = extractValue(values, new ExprParam("TO", Integer.class));
                Phrase by = extractValue(values, new ExprParam("BY", Integer.class));
                Binary exprAssig = Binary.make(Binary.Op.ASSIGNMENT, (Expr) var, (Expr) from);
                Binary exprCondition = Binary.make(Binary.Op.LTE, (Expr) var, (Expr) to);
                Binary exprBy = Binary.make(Binary.Op.ADD, (Expr) var, (Expr) by);
                exprList.addExpr(exprAssig);
                exprList.addExpr(exprCondition);
                exprList.addExpr(exprBy);
                exprList.setReadOnly();
                return extractRepeatStatement(block, exprList, "FOR");

            case "controls_forEach":
                var = extractVar(block);
                values = extractValues(block, (short) 1);
                expr = extractValue(values, new ExprParam("LIST", List.class));

                Binary exprBinary = Binary.make(Binary.Op.IN, (Expr) var, (Expr) expr);
                return extractRepeatStatement(block, exprBinary, "FOR_EACH");

            case "controls_flow_statements":
                fields = extractFields(block, (short) 1);
                mode = extractField(fields, "FLOW", (short) 0);
                return StmtFlowCon.make(Flow.get(mode));

            case "controls_repeat_ext":
                values = extractValues(block, (short) 1);
                expr = extractValue(values, new ExprParam("TIMES", Integer.class));
                return extractRepeatStatement(block, expr, "TIMES");

            default:
                throw new RuntimeException("Invalid Block: " + block.getType());
        }
    }

    private Phrase blockToUnaryExpr(Block block, ExprParam exprParam, String operationType) {
        String op = getOperation(block, operationType);
        List<Value> values = extractValues(block, (short) 1);
        Phrase expr = extractValue(values, exprParam);
        return Unary.make(Unary.Op.get(op), (Expr) expr);
    }

    private Binary blockToBinaryExpr(Block block, ExprParam leftExpr, ExprParam rightExpr, String operationType) {
        String op = getOperation(block, operationType);
        List<Value> values = extractValues(block, (short) 2);
        Phrase left = extractValue(values, leftExpr);
        Phrase right = extractValue(values, rightExpr);
        return Binary.make(Binary.Op.get(op), (Expr) left, (Expr) right);
    }

    private Funct blockToFunction(Block block, List<ExprParam> exprParams, String operationType) {
        String op = getOperation(block, operationType);
        List<Expr> params = new ArrayList<Expr>();
        List<Value> values = extractValues(block, (short) exprParams.size());
        for ( ExprParam exprParam : exprParams ) {
            params.add((Expr) extractValue(values, exprParam));
        }
        return Funct.make(Funct.Function.get(op), params);
    }

    private Phrase blocksToIfStmt(Block block, int _else, int _elseIf) {
        List<Expr> exprsList = new ArrayList<Expr>();
        List<StmtList> thenList = new ArrayList<StmtList>();
        StmtList elseList = null;

        List<Value> values = new ArrayList<Value>();
        List<Statement> statements = new ArrayList<Statement>();

        if ( _else + _elseIf != 0 ) {
            List<Object> valAndStmt = block.getRepetitions().getValueAndStatement();
            Assert.isTrue(valAndStmt.size() <= 2 * _elseIf + 2 + _else);
            convertStmtValList(values, statements, valAndStmt);
        } else {
            values = extractValues(block, (short) 1);
            statements = extractStatements(block, (short) 1);
        }

        for ( int i = 0; i < _elseIf + _else + 1; i++ ) {
            if ( _else != 0 && i == _elseIf + _else ) {
                elseList = extractStatement(statements, "ELSE");
            } else {
                Phrase p = extractValue(values, new ExprParam("IF" + i, Boolean.class));

                exprsList.add(convertPhraseToExpr(p));
                thenList.add(extractStatement(statements, "DO" + i));
            }
        }

        if ( _else != 0 ) {
            return IfStmt.make(exprsList, thenList, elseList);
        } else {
            return IfStmt.make(exprsList, thenList);
        }
    }

    private void convertStmtValList(List<Value> values, List<Statement> statements, List<Object> valAndStmt) {
        for ( int i = 0; i < valAndStmt.size(); i++ ) {
            Object ob = valAndStmt.get(i);
            if ( ob.getClass() == Value.class ) {
                values.add((Value) ob);
            } else {
                statements.add((Statement) ob);
            }
        }
    }

    private ExprList blockToExprList(Block block, Class<?> defVal) {
        int items = 0;
        if ( block.getMutation().getItems() != null ) {
            items = block.getMutation().getItems().intValue();
        }
        List<Value> values = block.getValue();
        Assert.isTrue(values.size() <= items, "Number of values is not less or equal to number of items in mutation!");
        return valuesToExprList(values, defVal, items);
    }

    private Phrase blockToConst(Block block, String type) {
        //what about template class?
        List<Field> fields = extractFields(block, (short) 1);
        String field = extractField(fields, type, (short) 0);
        switch ( type ) {
            case "BOOL":
                return BoolConst.make(Boolean.parseBoolean(field.toLowerCase()));
            case "NUM":
                return NumConst.make(field);
            case "TEXT":
                return StringConst.make(field);
            case "CONSTANT":
                return MathConst.make(MathConst.Const.get(field));
            case "COLOUR":
                return ColorConst.make(field);
            default:
                throw new RuntimeException("Invalid type constant!");
        }
    }

    private StmtList blocksToStmtList(List<Block> statementBolcks) {
        StmtList stmtList = StmtList.make();
        for ( Block sb : statementBolcks ) {
            convertPhraseToStmt(stmtList, sb);
        }
        stmtList.setReadOnly();
        return stmtList;
    }

    private void convertPhraseToStmt(StmtList stmtList, Block sb) {
        Phrase p = bToA(sb);
        Stmt stmt;
        if ( p.getKind().getCategory() == Category.EXPR ) {
            stmt = ExprStmt.make((Expr) p);
        } else if ( p.getKind().getCategory() == Category.ACTOR ) {
            stmt = ActionStmt.make((Action) p);
        } else if ( p.getKind().getCategory() == Category.SENSOR ) {
            stmt = SensorStmt.make((Sensor) p);
        } else {
            stmt = (Stmt) p;
        }
        stmtList.addStmt(stmt);
    }

    private Expr convertPhraseToExpr(Phrase p) {
        Expr expr;
        if ( p.getKind().getCategory() == Category.SENSOR ) {
            expr = SensorExpr.make((Sensor) p);
        } else if ( p.getKind().getCategory() == Category.ACTOR ) {
            expr = ActionExpr.make((Action) p);
        } else {
            expr = (Expr) p;
        }
        return expr;
    }

    private ExprList valuesToExprList(List<Value> values, Class<?> defVal, int nItems) {
        ExprList exprList = ExprList.make();
        for ( int i = 0; i < nItems; i++ ) {
            exprList.addExpr((Expr) extractValue(values, new ExprParam("ADD" + i, defVal)));
        }
        exprList.setReadOnly();
        return exprList;
    }

    private String getOperation(Block block, String operationType) {
        String op = operationType;
        if ( block.getField().size() != 0 ) {
            op = extractOperation(block, operationType);
        }
        return op;
    }

    private Phrase extractRepeatStatement(Block block, Phrase expr, String mode) {
        return extractRepeatStatement(block, expr, mode, "DO", 1);
    }

    private Phrase extractRepeatStatement(Block block, Phrase expr, String mode, String location, int mutation) {
        List<Statement> statements = extractStatements(block, (short) mutation);
        StmtList stmtList = extractStatement(statements, location);
        return RepeatStmt.make(RepeatStmt.Mode.get(mode), (Expr) expr, stmtList);
    }

    private Phrase extractVar(Block block) {
        List<Field> fields = extractFields(block, (short) 1);
        String field = extractField(fields, "VAR", (short) 0);
        return Var.make(field);
    }

    private List<Value> extractValues(Block block, short numOfValues) {
        List<Value> values;
        values = block.getValue();
        Assert.isTrue(values.size() <= numOfValues, "Values size is not less or equal to " + numOfValues + "!");
        return values;
    }

    private Phrase extractValue(List<Value> values, ExprParam param) {
        for ( Value value : values ) {
            if ( value.getName().equals(param.getName()) ) {
                return bToA(value.getBlock());
            }
        }
        return EmptyExpr.make(param.getDefaultValue());
    }

    private List<Statement> extractStatements(Block block, short numOfStatements) {
        List<Statement> statements;
        statements = block.getStatement();
        Assert.isTrue(statements.size() <= numOfStatements, "Statements size is not less or equal to " + numOfStatements + "!");
        return statements;
    }

    private StmtList extractStatement(List<Statement> statements, String stmtName) {
        StmtList stmtList = StmtList.make();
        for ( Statement statement : statements ) {
            if ( statement.getName().equals(stmtName) ) {
                return blocksToStmtList(statement.getBlock());
            }
        }
        stmtList.setReadOnly();
        return stmtList;
    }

    private List<Field> extractFields(Block block, short numOfFields) {
        List<Field> fields;
        fields = block.getField();
        Assert.isTrue(fields.size() == numOfFields, "Number of fields is not equal to " + numOfFields + "!");
        return fields;
    }

    private String extractField(List<Field> fields, String name, short fieldLocation) {
        Field field = fields.get(fieldLocation);
        Assert.isTrue(field.getName().equals(name), "Field name is not equal to " + name + "!");
        return field.getValue();
    }

    private String extractOperation(Block block, String name) {
        List<Field> fields = extractFields(block, (short) 1);
        String operation = extractField(fields, name, (short) 0);
        return operation;
    }

    @Override
    public String toString() {
        return "BlockAST [project=" + this.project + "]";
    }
}
